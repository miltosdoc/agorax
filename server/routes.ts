import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { updatePollLocations } from "./update-poll-locations";
import {
  createPollSchema,
  createSurveyPollSchema,
  insertVoteSchema,
  rankingVoteSchema,
  insertCommentSchema,
  insertGroupSchema,
  users,
  votes,
  insertPollUserResponseSchema
} from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

const addGroupMemberSchema = z.object({
  email: z.string().email("Invalid email format")
});

/**
 * Helper function to format Zod validation errors in a more user-friendly way.
 * 
 * @param errors The raw Zod validation errors
 * @returns A more user-friendly error object
 */
function formatValidationErrors(errors: Record<string, any>): Record<string, any> {
  const formattedErrors: Record<string, any> = {};

  // Helper function to recursively process errors
  function processErrors(obj: Record<string, any>, path: string = "") {
    for (const key in obj) {
      const fullPath = path ? `${path}.${key}` : key;

      if (key === "_errors" && Array.isArray(obj[key])) {
        if (obj[key].length > 0) {
          // We have actual error messages here
          let location = path;
          if (location === "") {
            location = "general";
          }

          if (!formattedErrors[location]) {
            formattedErrors[location] = [];
          }

          // Add all error messages for this field
          for (const error of obj[key]) {
            formattedErrors[location].push(error);
          }
        }
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        // Recursively process nested objects
        processErrors(obj[key], fullPath);
      }
    }
  }

  processErrors(errors);

  // Special case for optionId which is often required in votes
  if (errors.optionId?._errors?.includes("Required")) {
    formattedErrors.optionId = ["Παρακαλώ επιλέξτε μια επιλογή"];
  }

  return formattedErrors;
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Setup authentication routes
  setupAuth(app);

  // Consolidated route for /polls/:id with social bot detection
  app.get("/polls/:id", async (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';

    // Detect social media crawlers and preview bots
    const isSocialBot = /facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|skypeuripreview|slackbot|discordbot/i.test(userAgent);

    if (!isSocialBot) {
      // Regular users - let frontend handle this route
      return next();
    }

    // Social bots - serve SEO-optimized HTML with Open Graph tags
    try {
      const pollId = parseInt(req.params.id);
      const poll = await storage.getPoll(pollId);

      if (!poll) {
        return next(); // Let frontend handle 404
      }

      const results = await storage.getPollResults(pollId);
      const totalVotes = results.reduce((sum, result) => sum + result.voteCount, 0);
      const isActive = new Date(poll.endDate) > new Date();

      // Clean description without HTML tags
      const cleanDescription = poll.description
        ? poll.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
        : '';

      // Optimized description for social sharing
      const shareDescription = cleanDescription
        ? `${cleanDescription.substring(0, 150)}... 🗳️ Ψηφίστε στο AgoraX!`
        : `🗳️ Συμμετέχετε στην ψηφοφορία και εκφράστε τη γνώμη σας!`;

      const pollUrl = `${req.protocol}://${req.get('host')}/polls/${pollId}`;
      const ogImage = `${req.protocol}://${req.get('host')}/api/og-image/${pollId}?v=3`;

      const html = `<!DOCTYPE html>
<html lang="el">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${poll.title} - AgoraX</title>
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${pollUrl}">
    <meta property="og:title" content="${poll.title}">
    <meta property="og:description" content="${shareDescription}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/png">
    <meta property="og:site_name" content="AgoraX">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${poll.title}">
    <meta name="twitter:description" content="${shareDescription}">
    <meta name="twitter:image" content="${ogImage}">
    
    <meta name="description" content="${shareDescription}">
</head>
<body>
    <div style="font-family: Arial; max-width: 600px; margin: 2rem auto; padding: 2rem;">
        <h1>${poll.title}</h1>
        <p>${cleanDescription}</p>
        <p>Κατηγορία: ${poll.category} • Ψήφοι: ${totalVotes} • ${isActive ? 'Ενεργή' : 'Κλειστή'}</p>
        <a href="${pollUrl}" style="background: #2563eb; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 6px; display: inline-block;">Δείτε την ψηφοφορία</a>
    </div>
</body>
</html>`;

      res.send(html);
    } catch (error) {
      console.error("Error generating bot HTML:", error);
      next();
    }
  });

  // Open Graph image generation for social media previews (minimal design with logo)
  app.get("/api/og-image/:id", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const poll = await storage.getPoll(pollId);

      if (!poll) {
        return res.status(404).send("Poll not found");
      }

      const { createCanvas, loadImage } = await import('canvas');
      const path = await import('path');

      // Standard OpenGraph size: 1200x630
      const width = 1200;
      const height = 630;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Clean white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Load and draw logo (centered)
      try {
        const logoPath = path.resolve(process.cwd(), 'client/public/logo-share.png');
        const logo = await loadImage(logoPath);
        const logoSize = 200;
        const logoX = (width - logoSize) / 2;
        const logoY = (height - logoSize) / 2;
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
      } catch (err) {
        // If logo fails to load, show AgoraX text instead
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AgoraX', width / 2, height / 2);
      }

      // Convert to PNG buffer
      const pngBuffer = canvas.toBuffer('image/png');

      // Serve PNG with caching headers
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Disposition', 'inline; filename="poll-preview.png"');
      res.send(pngBuffer);

    } catch (error) {
      console.error("Error generating OG image:", error);
      res.status(500).send("Error generating image");
    }
  });

  // Protected route middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Poll routes
  app.get("/api/polls", async (req, res) => {
    try {
      const {
        status,
        category,
        sort,
        page = "1",
        pageSize = "9",
        locationScope,
        locationCountry,
        locationRegion,
        locationCity,
        groupId
      } = req.query;

      const filters = {
        status: status as string,
        category: category as string,
        sort: sort as string,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        userId: req.isAuthenticated() ? req.user.id : undefined,
        locationScope: locationScope as string,
        locationCountry: locationCountry as string,
        locationRegion: locationRegion as string,
        locationCity: locationCity as string,
        groupId: groupId ? parseInt(groupId as string) : undefined
      };

      const polls = await storage.getPolls(filters);
      res.json(polls);
    } catch (error) {
      console.error("Error fetching polls:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση ψηφοφοριών" });
    }
  });

  app.get("/api/polls/my", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const polls = await storage.getUserPolls(userId);
      res.json(polls);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση των ψηφοφοριών σας" });
    }
  });

  app.get("/api/polls/participated", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const polls = await storage.getParticipatedPolls(userId);
      res.json(polls);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση των συμμετοχών σας" });
    }
  });

  app.get("/api/polls/:id", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.isAuthenticated() ? req.user.id : undefined;
      const poll = await storage.getPoll(pollId, userId);

      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }

      res.json(poll);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση της ψηφοφορίας" });
    }
  });

  app.post("/api/polls", requireAuth, async (req, res) => {
    try {
      console.log("Creating poll with data:", JSON.stringify(req.body, null, 2));

      const parsedData = createPollSchema.safeParse(req.body);

      if (!parsedData.success) {
        console.log("Poll data validation failed:", parsedData.error.format());
        return res.status(400).json({
          message: "Λανθασμένα δεδομένα ψηφοφορίας",
          errors: parsedData.error.format()
        });
      }

      console.log("Parsed poll data:", JSON.stringify(parsedData.data, null, 2));
      const { poll, options } = parsedData.data;
      const creatorId = req.user.id;

      console.log("Creating poll with creator:", creatorId);
      console.log("Poll object:", JSON.stringify({ ...poll, creatorId }, null, 2));
      console.log("Options:", JSON.stringify(options, null, 2));

      try {
        const createdPoll = await storage.createPoll({
          ...poll,
          creatorId
        }, options);

        // Notify group members if poll is in a group
        if (createdPoll.groupId) {
          try {
            const group = await storage.getGroup(createdPoll.groupId);
            if (group && group.members) {
              // Create notifications for all group members except the creator
              const notificationPromises = group.members
                .filter(member => member.userId !== creatorId)
                .map(member =>
                  storage.createPollNotification({
                    userId: member.userId,
                    pollId: createdPoll.id
                  })
                );

              await Promise.all(notificationPromises);
              console.log(`Created ${notificationPromises.length} notifications for poll ${createdPoll.id}`);
            }
          } catch (notificationError) {
            console.error("Error creating notifications:", notificationError);
          }
        }

        res.status(201).json(createdPoll);
      } catch (storageError) {
        console.error("Error in storage.createPoll:", storageError);
        throw storageError;
      }
    } catch (error) {
      console.error("Error creating poll:", error);
      res.status(500).json({ message: "Σφάλμα κατά τη δημιουργία ψηφοφορίας", error: String(error) });
    }
  });

  app.patch("/api/polls/:id", requireAuth, async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user.id;

      console.log("Poll update request received for poll ID:", pollId);
      console.log("Update data:", JSON.stringify(req.body, null, 2));

      // Check if user is the creator
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }

      if (poll.creatorId !== userId) {
        return res.status(403).json({ message: "Δεν έχετε δικαίωμα να επεξεργαστείτε αυτή την ψηφοφορία" });
      }

      // Handle empty strings in numeric fields to avoid database errors
      const updates = { ...req.body };

      // Remove creatorId from updates to preserve the original creator
      // This prevents foreign key constraint issues
      delete updates.creatorId;

      // Special handling for description - must be at least empty string, not null
      if (updates.description === '' || updates.description === null) {
        updates.description = ''; // Empty string instead of null to satisfy not-null constraint
      }

      // Fix potential issues with empty coordinate strings
      if (updates.centerLat === '') updates.centerLat = null;
      if (updates.centerLng === '') updates.centerLng = null;
      if (updates.radiusKm === '') updates.radiusKm = null;

      // Handle empty location strings
      if (updates.locationCity === '') updates.locationCity = null;
      if (updates.locationRegion === '') updates.locationRegion = null;
      if (updates.locationCountry === '') updates.locationCountry = null;

      // Fix date fields - convert to proper Date objects
      if (updates.startDate && typeof updates.startDate === 'string') {
        updates.startDate = new Date(updates.startDate);
      }
      if (updates.endDate && typeof updates.endDate === 'string') {
        updates.endDate = new Date(updates.endDate);
      }

      // Clean up empty string values to avoid database errors
      // But exclude description field which needs to remain an empty string
      Object.keys(updates).forEach(key => {
        if (key !== 'description' && updates[key] === '') {
          updates[key] = null;
        }
      });

      console.log("Processed updates:", JSON.stringify(updates, null, 2));

      const updatedPoll = await storage.updatePoll(pollId, updates);
      res.json(updatedPoll);
    } catch (error) {
      console.error("Error updating poll:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ενημέρωση της ψηφοφορίας", error: error.message });
    }
  });

  app.delete("/api/polls/:id", requireAuth, async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user.id;

      // Check if user is the creator
      const poll = await storage.getPoll(pollId, userId);
      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }

      if (poll.creatorId !== userId) {
        return res.status(403).json({ message: "Δεν έχετε δικαίωμα να διαγράψετε αυτή την ψηφοφορία" });
      }

      // Check if the poll has more than 100 participants
      const participantCount = await storage.getPollParticipantCount(pollId);
      if (participantCount > 100) {
        return res.status(403).json({
          message: "Δεν μπορείτε να διαγράψετε μια ψηφοφορία με πάνω από 100 συμμετέχοντες",
          canSetCommunity: true // Indicate that community mode is an option
        });
      }

      const result = await storage.deletePoll(pollId);
      if (result) {
        res.json({ success: true, message: "Η ψηφοφορία διαγράφηκε επιτυχώς" });
      } else {
        res.status(500).json({ message: "Σφάλμα κατά τη διαγραφή της ψηφοφορίας" });
      }
    } catch (error) {
      console.error("Error deleting poll:", error);
      res.status(500).json({ message: "Σφάλμα κατά τη διαγραφή της ψηφοφορίας" });
    }
  });

  // Endpoint to set poll to community mode (removing creator association)
  app.patch("/api/polls/:id/community", requireAuth, async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user.id;

      // Check if user is the creator
      const poll = await storage.getPoll(pollId, userId);
      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }

      if (poll.creatorId !== userId) {
        return res.status(403).json({ message: "Δεν έχετε δικαίωμα να μεταφέρετε αυτή την ψηφοφορία" });
      }

      // Update the poll to community mode
      const updatedPoll = await storage.updatePoll(pollId, { communityMode: true });
      res.json({ success: true, message: "Η ψηφοφορία μεταφέρθηκε στην κοινότητα", poll: updatedPoll });
    } catch (error) {
      console.error("Error setting poll to community mode:", error);
      res.status(500).json({ message: "Σφάλμα κατά τη μεταφορά της ψηφοφορίας" });
    }
  });

  app.patch("/api/polls/:id/extend", requireAuth, async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user.id;
      const { newEndDate } = req.body;

      if (!newEndDate) {
        return res.status(400).json({ message: "Απαιτείται νέα ημερομηνία λήξης" });
      }

      // Check if user is the creator
      const poll = await storage.getPoll(pollId, userId);
      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }

      if (poll.creatorId !== userId) {
        return res.status(403).json({ message: "Δεν έχετε δικαίωμα να επεκτείνετε αυτή την ψηφοφορία" });
      }

      if (!poll.allowExtension) {
        return res.status(400).json({ message: "Η επέκταση δεν επιτρέπεται για αυτή την ψηφοφορία" });
      }

      if (!poll.isActive) {
        return res.status(400).json({ message: "Δεν μπορείτε να επεκτείνετε μια ολοκληρωμένη ψηφοφορία" });
      }

      const updatedPoll = await storage.extendPollDuration(pollId, new Date(newEndDate));
      res.json(updatedPoll);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά την επέκταση της ψηφοφορίας" });
    }
  });

  app.post("/api/polls/:id/vote", requireAuth, async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user.id;

      // Check if poll exists and is active
      const poll = await storage.getPoll(pollId, userId);
      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }

      // SECURITY: Group membership check for voting
      if (poll.groupId) {
        const isMember = await storage.isGroupMember(poll.groupId, userId);
        if (!isMember) {
          return res.status(403).json({ message: "You must be a member of this group to vote" });
        }
      }

      if (!poll.isActive) {
        return res.status(400).json({ message: "Η ψηφοφορία έχει ολοκληρωθεί" });
      }

      // Get user data to check location eligibility
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Χρήστης δεν βρέθηκε" });
      }

      // Check for Gov.gr verification - MANDATORY for all votes
      if (!user.govgrVerified) {
        return res.status(403).json({
          message: "Απαιτείται επαλήθευση ταυτότητας Gov.gr για να ψηφίσετε. Παρακαλώ επαληθεύστε την ταυτότητά σας πρώτα."
        });
      }

      // Debug logging for location data
      console.log(`[VOTE] User location data for user ID ${userId}:`, {
        city: user.city,
        region: user.region,
        country: user.country,
        city_id: user.city_id,
        region_id: user.region_id,
        country_id: user.country_id
      });

      console.log(`[VOTE] Poll location restrictions:`, {
        locationScope: poll.locationScope,
        locationCity: poll.locationCity,
        locationRegion: poll.locationRegion,
        locationCountry: poll.locationCountry
      });

      // Import the location validator
      const { isUserEligibleForPoll } = await import('./utils/location-validator');

      // Check if user is eligible to vote based on location restrictions
      const eligibility = isUserEligibleForPoll(poll, user);
      console.log(`[VOTE] Eligibility result:`, eligibility);

      if (!eligibility.isEligible) {
        return res.status(403).json({
          message: eligibility.message || "Δεν επιτρέπεται να ψηφίσετε λόγω περιορισμών τοποθεσίας"
        });
      }

      // Check if user already voted
      const hasVoted = await storage.hasUserVoted(pollId, userId);
      console.log(`[VOTE] User ${userId} has voted: ${hasVoted}`);

      // If they already voted, check if they can edit their vote
      if (hasVoted) {
        // Check if vote can be edited (within 60 minutes)
        const canEdit = await storage.canEditVote(pollId, userId);
        console.log(`[VOTE] Can edit vote: ${canEdit}`);
        if (!canEdit) {
          return res.status(403).json({
            message: "Δεν μπορείτε να αλλάξετε την ψήφο σας μετά από 60 λεπτά",
            canEdit: false
          });
        }

        // Delete the existing vote before creating a new one
        console.log(`[VOTE] Deleting existing votes for user ${userId} on poll ${pollId}`);
        await db.delete(votes).where(
          and(
            eq(votes.pollId, pollId),
            eq(votes.userId, userId)
          )
        );

        // The vote will be recreated below
      }

      // Handle different poll types
      if (poll.pollType === 'ranking') {
        // For ranking polls, validate with rankingVoteSchema
        const validateRankingVote = rankingVoteSchema.safeParse({
          ...req.body,
          pollId,
          userId
        });

        if (!validateRankingVote.success) {
          // Format the validation errors to be more user-friendly
          const formattedErrors = formatValidationErrors(validateRankingVote.error.format());

          return res.status(400).json({
            message: "Λανθασμένα δεδομένα κατάταξης",
            errors: formattedErrors,
            errorType: "validation" // Indicate that these are validation errors
          });
        }

        const vote = await storage.createVote(validateRankingVote.data);
        return res.status(201).json({
          ...vote,
          isEdit: hasVoted
        });
      } else {
        // For regular polls, handle both single choice and multiple choice
        console.log("Received vote data:", req.body);
        console.log("Vote data for validation:", { ...req.body, pollId, userId });

        // Check if this is a multiple choice vote (has optionIds array)
        if (req.body.optionIds && Array.isArray(req.body.optionIds)) {
          // Multiple choice voting - create separate votes for each option
          const votes = [];

          for (const optionId of req.body.optionIds) {
            const validateVote = insertVoteSchema.safeParse({
              optionId,
              pollId,
              userId,
              comment: req.body.comment
            });

            if (!validateVote.success) {
              const formattedErrors = formatValidationErrors(validateVote.error.format());
              console.log("Vote validation failed for option", optionId, ":", validateVote.error);

              return res.status(400).json({
                message: "Λανθασμένα δεδομένα ψήφου",
                errors: formattedErrors,
                errorType: "validation"
              });
            }

            const vote = await storage.createVote(validateVote.data);
            votes.push(vote);
          }

          return res.status(201).json({
            votes,
            isEdit: hasVoted,
            count: votes.length
          });
        } else {
          // Single choice voting
          const validateVote = insertVoteSchema.safeParse({
            ...req.body,
            pollId,
            userId
          });

          if (!validateVote.success) {
            const formattedErrors = formatValidationErrors(validateVote.error.format());
            console.log("Vote validation failed:", validateVote.error);
            console.log("Formatted errors:", formattedErrors);

            return res.status(400).json({
              message: "Λανθασμένα δεδομένα ψήφου",
              errors: formattedErrors,
              errorType: "validation"
            });
          }

          const vote = await storage.createVote(validateVote.data);
          return res.status(201).json({
            ...vote,
            isEdit: hasVoted
          });
        }
      }
    } catch (error) {
      console.error("Vote submission error:", error);
      res.status(500).json({ message: "Σφάλμα κατά την υποβολή ψήφου" });
    }
  });

  app.get("/api/polls/:id/results", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const results = await storage.getPollResults(pollId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση των αποτελεσμάτων" });
    }
  });

  app.post("/api/polls/:id/comments", requireAuth, async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user.id;

      const validateComment = insertCommentSchema.safeParse({
        ...req.body,
        pollId,
        userId
      });

      if (!validateComment.success) {
        return res.status(400).json({
          message: "Λανθασμένα δεδομένα σχολίου",
          errors: validateComment.error.format()
        });
      }

      // Check if poll exists and allows comments
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }

      if (!poll.allowComments) {
        return res.status(400).json({ message: "Τα σχόλια δεν επιτρέπονται σε αυτή την ψηφοφορία" });
      }

      const comment = await storage.createComment(validateComment.data);
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά τη δημιουργία σχολίου" });
    }
  });

  app.get("/api/polls/:id/comments", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const comments = await storage.getPollComments(pollId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση σχολίων" });
    }
  });

  // Group routes
  app.post("/api/groups", requireAuth, async (req, res) => {
    try {
      const parsedData = insertGroupSchema.safeParse({
        ...req.body,
        creatorId: req.user.id
      });

      if (!parsedData.success) {
        return res.status(400).json({
          message: "Λανθασμένα δεδομένα ομάδας",
          errors: parsedData.error.format()
        });
      }

      const { name } = parsedData.data;
      const creatorId = req.user.id;
      const group = await storage.createGroup(name, creatorId);

      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Σφάλμα κατά τη δημιουργία ομάδας" });
    }
  });

  app.get("/api/groups", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const groups = await storage.getUserGroups(userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση ομάδων" });
    }
  });

  app.get("/api/groups/:id", requireAuth, async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const userId = req.user.id;

      const group = await storage.getGroup(groupId);

      if (!group) {
        return res.status(404).json({ message: "Η ομάδα δεν βρέθηκε" });
      }

      const isMember = await storage.isGroupMember(groupId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Δεν έχετε πρόσβαση σε αυτή την ομάδα" });
      }

      res.json(group);
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση ομάδας" });
    }
  });

  app.post("/api/groups/:id/members", requireAuth, async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const requesterId = req.user.id;

      const validation = addGroupMemberSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Μη έγκυρα δεδομένα",
          errors: validation.error.flatten()
        });
      }

      const { email } = validation.data;

      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Η ομάδα δεν βρέθηκε" });
      }

      const isCreator = group.creatorId === requesterId;
      const isMember = await storage.isGroupMember(groupId, requesterId);

      if (!isCreator && !isMember) {
        return res.status(403).json({ message: "Δεν έχετε δικαίωμα να προσθέσετε μέλη σε αυτή την ομάδα" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User with this email is not registered" });
      }

      const member = await storage.addGroupMember(groupId, email);
      res.status(201).json({ success: true, message: "Το μέλος προστέθηκε επιτυχώς", member });
    } catch (error: any) {
      console.error("Error adding group member:", error);

      if (error.message === "User is already a member of this group") {
        return res.status(400).json({ message: "Ο χρήστης είναι ήδη μέλος της ομάδας" });
      }

      res.status(500).json({ message: "Σφάλμα κατά την προσθήκη μέλους" });
    }
  });

  app.delete("/api/groups/:id/members/:userId", requireAuth, async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const userIdToRemove = parseInt(req.params.userId);
      const requesterId = req.user.id;

      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Η ομάδα δεν βρέθηκε" });
      }

      if (group.creatorId !== requesterId) {
        return res.status(403).json({ message: "Μόνο ο δημιουργός της ομάδας μπορεί να αφαιρέσει μέλη" });
      }

      const result = await storage.removeGroupMember(groupId, userIdToRemove);

      if (result) {
        res.json({ success: true, message: "Το μέλος αφαιρέθηκε επιτυχώς" });
      } else {
        res.status(404).json({ message: "Το μέλος δεν βρέθηκε στην ομάδα" });
      }
    } catch (error) {
      console.error("Error removing group member:", error);
      res.status(500).json({ message: "Σφάλμα κατά την αφαίρεση μέλους" });
    }
  });

  app.delete("/api/groups/:id/leave", requireAuth, async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const userId = req.user.id;

      const result = await storage.removeGroupMember(groupId, userId);

      if (result) {
        res.json({ success: true, message: "Αποχωρήσατε από την ομάδα επιτυχώς" });
      } else {
        res.status(404).json({ message: "Δεν είστε μέλος αυτής της ομάδας" });
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      res.status(500).json({ message: "Σφάλμα κατά την αποχώρηση από την ομάδα" });
    }
  });

  app.delete("/api/groups/:id", requireAuth, async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const userId = req.user.id;

      const result = await storage.deleteGroup(groupId, userId);

      if (result) {
        res.json({ success: true, message: "Η ομάδα διαγράφηκε επιτυχώς" });
      } else {
        res.status(500).json({ message: "Σφάλμα κατά τη διαγραφή ομάδας" });
      }
    } catch (error) {
      console.error("Error deleting group:", error);

      if (error.message === "Group not found") {
        return res.status(404).json({ message: "Η ομάδα δεν βρέθηκε" });
      }

      if (error.message === "Only the group creator can delete the group") {
        return res.status(403).json({ message: "Μόνο ο δημιουργός μπορεί να διαγράψει την ομάδα" });
      }

      res.status(500).json({ message: "Σφάλμα κατά τη διαγραφή ομάδας" });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση ειδοποιήσεων" });
    }
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user.id;

      const notifications = await storage.getUserNotifications(userId);
      const notification = notifications.find(n => n.id === notificationId);

      if (!notification) {
        return res.status(404).json({ message: "Η ειδοποίηση δεν βρέθηκε" });
      }

      if (notification.userId !== userId) {
        return res.status(403).json({ message: "Δεν έχετε δικαίωμα πρόσβασης σε αυτή την ειδοποίηση" });
      }

      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json({ success: true, notification: updatedNotification });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ενημέρωση ειδοποίησης" });
    }
  });

  app.get("/api/notifications/unread/count", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getUserNotifications(userId);
      const unreadCount = notifications.filter(n => !n.read).length;
      res.json({ count: unreadCount });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση μη αναγνωσμένων ειδοποιήσεων" });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const categories = [
        // Politics & Democracy
        "Πολιτική",
        "Τοπική Αυτοδιοίκηση",
        "Νομοθεσία",
        "Δημόσια Διοίκηση",
        "Εκλογές",
        "Προϋπολογισμός",
        "Δημοκρατία",
        "Διαφάνεια",
        "Συμμετοχή",
        "Ευρωπαϊκή Ένωση",

        // Economy & Society
        "Περιβάλλον",
        "Οικονομία",
        "Κοινωνία",
        "Δικαιοσύνη",
        "Παιδεία",
        "Υγεία",
        "Ασφάλεια",

        // Science & Technology
        "Τεχνολογία",
        "Επιστήμη",
        "Καινοτομία",
        "Φυσική",
        "Πληροφορική",
        "Τεχνητή Νοημοσύνη",
        "Διάστημα",
        "Δεδομένα",
        "Υπολογιστικό Νέφος",

        // Culture & Infrastructure
        "Πολιτισμός",
        "Υποδομές",
        "Στρατηγικός Σχεδιασμός",
        "Βιομηχανία",
        "Επιχειρήσεις",

        // Other
        "Άλλο"
      ];
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση κατηγοριών" });
    }
  });

  // User location routes
  const locationSchema = z.object({
    // Display names (for UI)
    city: z.string().optional(),
    region: z.string().optional(),
    country: z.string().optional(),

    // Standardized IDs (for database lookups and comparisons)
    city_id: z.string().optional(),
    region_id: z.string().optional(),
    country_id: z.string().optional(),

    // Coordinates
    latitude: z.string().optional(),
    longitude: z.string().optional(),

    // Confirmation flag
    locationConfirmed: z.boolean().optional()
  });

  // Location verification schema
  const verifyLocationSchema = z.object({
    verified: z.boolean()
  });

  // Endpoint to verify manually entered coordinates
  app.patch("/api/user/verify-location", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Δεν είστε συνδεδεμένοι" });
      }

      const parsedData = verifyLocationSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          message: "Λανθασμένα δεδομένα επαλήθευσης",
          errors: parsedData.error.format()
        });
      }

      // Update the user's location verification status
      const updated = await storage.verifyUserLocation(userId, parsedData.data.verified);

      // If verification is false, reset the location confirmation as well
      if (!parsedData.data.verified) {
        await storage.updateUserLocation(userId, {
          locationConfirmed: false,
          locationVerified: false
        });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error verifying location:", error);
      res.status(500).json({ message: "Σφάλμα κατά την επαλήθευση τοποθεσίας" });
    }
  });

  app.patch("/api/user/location", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const parsedData = locationSchema.safeParse(req.body);

      if (!parsedData.success) {
        return res.status(400).json({
          message: "Λανθασμένα δεδομένα τοποθεσίας",
          errors: parsedData.error.format()
        });
      }

      const updatedUser = await storage.updateUserLocation(userId, parsedData.data);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά την ενημέρωση της τοποθεσίας" });
    }
  });

  // The verify-location endpoint is already defined above

  // Survey Poll Routes
  app.post("/api/surveys", requireAuth, async (req, res) => {
    try {
      console.log("Creating survey poll with data:", JSON.stringify(req.body, null, 2));

      const parsedData = createSurveyPollSchema.safeParse(req.body);

      if (!parsedData.success) {
        console.log("Survey poll data validation failed:", parsedData.error.format());
        return res.status(400).json({
          message: "Λανθασμένα δεδομένα δημοσκόπησης",
          errors: parsedData.error.format()
        });
      }

      console.log("Parsed survey poll data:", JSON.stringify(parsedData.data, null, 2));
      const { poll, questions } = parsedData.data;
      const creatorId = req.user.id;

      // Organize answers by question
      const questionAnswers = questions.map(question => ({
        questionId: question.id,
        answers: question.answers.map((answer, index) => ({
          id: answer.id || index + 1, // Use provided ID or generate one
          text: answer.text,
          order: answer.order || index
        }))
      }));

      // Prepare questions without answers
      const questionData = questions.map(question => {
        const { answers, ...questionWithoutAnswers } = question;
        return questionWithoutAnswers;
      });

      try {
        const createdPoll = await storage.createSurveyPoll({
          ...poll,
          creatorId
        }, questionData, questionAnswers);

        // Notify group members if poll is in a group
        if (createdPoll.groupId) {
          try {
            const group = await storage.getGroup(createdPoll.groupId);
            if (group && group.members) {
              // Create notifications for all group members except the creator
              const notificationPromises = group.members
                .filter(member => member.userId !== creatorId)
                .map(member =>
                  storage.createPollNotification({
                    userId: member.userId,
                    pollId: createdPoll.id
                  })
                );

              await Promise.all(notificationPromises);
              console.log(`Created ${notificationPromises.length} notifications for survey poll ${createdPoll.id}`);
            }
          } catch (notificationError) {
            console.error("Error creating notifications:", notificationError);
          }
        }

        res.status(201).json(createdPoll);
      } catch (storageError) {
        console.error("Error in storage.createSurveyPoll:", storageError);
        throw storageError;
      }
    } catch (error) {
      console.error("Error creating survey poll:", error);
      res.status(500).json({ message: "Σφάλμα κατά τη δημιουργία δημοσκόπησης", error: String(error) });
    }
  });

  app.get("/api/surveys/:id", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.isAuthenticated() ? req.user.id : undefined;
      const poll = await storage.getSurveyPoll(pollId, userId);

      if (!poll) {
        return res.status(404).json({ message: "Η δημοσκόπηση δεν βρέθηκε" });
      }

      res.json(poll);
    } catch (error) {
      console.error("Error retrieving survey poll:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση της δημοσκόπησης", error: String(error) });
    }
  });

  app.post("/api/surveys/:id/respond", requireAuth, async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user.id;

      // Check if poll exists and is active
      const poll = await storage.getSurveyPoll(pollId, userId);
      if (!poll) {
        return res.status(404).json({ message: "Η δημοσκόπηση δεν βρέθηκε" });
      }

      // SECURITY: Group membership check for survey responses
      if (poll.groupId) {
        const isMember = await storage.isGroupMember(poll.groupId, userId);
        if (!isMember) {
          return res.status(403).json({ message: "You must be a member of this group to respond to this survey" });
        }
      }

      if (!poll.isActive) {
        return res.status(400).json({ message: "Η δημοσκόπηση έχει ολοκληρωθεί" });
      }

      // Get user data to check location eligibility
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Χρήστης δεν βρέθηκε" });
      }

      // Import the location validator
      const { isUserEligibleForPoll } = await import('./utils/location-validator');

      // Check if user is eligible to participate based on location restrictions
      const eligibility = isUserEligibleForPoll(poll, user);
      if (!eligibility.isEligible) {
        return res.status(403).json({
          message: eligibility.message || "Δεν επιτρέπεται να συμμετάσχετε λόγω περιορισμών τοποθεσίας"
        });
      }

      // Check if user already responded
      const hasResponded = await storage.hasUserRespondedToSurvey(pollId, userId);
      if (hasResponded) {
        return res.status(400).json({ message: "Έχετε ήδη απαντήσει σε αυτή τη δημοσκόπηση" });
      }

      // Validate responses
      const responsesArray = req.body.responses;
      if (!Array.isArray(responsesArray) || responsesArray.length === 0) {
        return res.status(400).json({ message: "Οι απαντήσεις πρέπει να παρέχονται ως πίνακας" });
      }

      // Validate each response has answerId (except for ordering questions which use answerValue)
      // Use loose equality (==) to catch both null and undefined
      for (const response of responsesArray) {
        if (response.answerId == null && !response.answerValue) {
          return res.status(400).json({
            message: "Κάθε απάντηση πρέπει να έχει answerId ή answerValue"
          });
        }
      }

      // Add pollId and userId to each response
      const responses = responsesArray.map(response => ({
        ...response,
        pollId,
        userId
      }));

      // Create responses
      const createdResponses = await storage.createSurveyResponse(responses);
      res.status(201).json(createdResponses);
    } catch (error) {
      console.error("Error responding to survey:", error);
      res.status(500).json({ message: "Σφάλμα κατά την υποβολή απαντήσεων", error: String(error) });
    }
  });

  app.get("/api/surveys/:id/results", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);

      // Verify poll exists
      const poll = await storage.getSurveyPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Η δημοσκόπηση δεν βρέθηκε" });
      }

      // Check if results are visible
      if (!poll.showResults && !req.isAuthenticated()) {
        return res.status(403).json({ message: "Τα αποτελέσματα αυτής της δημοσκόπησης δεν είναι δημόσια" });
      }

      // If not creator and results not visible, deny access
      if (!poll.showResults && req.isAuthenticated() && req.user.id !== poll.creatorId) {
        return res.status(403).json({ message: "Δεν έχετε δικαίωμα να δείτε τα αποτελέσματα αυτής της δημοσκόπησης" });
      }

      const results = await storage.getSurveyResults(pollId);
      res.json(results);
    } catch (error) {
      console.error("Error retrieving survey results:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση των αποτελεσμάτων", error: String(error) });
    }
  });

  app.patch("/api/surveys/:id", requireAuth, async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user.id;

      // Check if user is the creator
      const poll = await storage.getSurveyPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Η δημοσκόπηση δεν βρέθηκε" });
      }

      if (poll.creatorId !== userId) {
        return res.status(403).json({ message: "Δεν έχετε δικαίωμα να επεξεργαστείτε αυτή τη δημοσκόπηση" });
      }

      // If we have questions in the body, parse as a full update
      if (req.body.questions) {
        const parsedData = createSurveyPollSchema.safeParse(req.body);

        if (!parsedData.success) {
          return res.status(400).json({
            message: "Λανθασμένα δεδομένα δημοσκόπησης",
            errors: parsedData.error.format()
          });
        }

        const { poll: pollData, questions } = parsedData.data;

        // Organize answers by question
        const questionAnswers = questions.map(question => ({
          questionId: question.id,
          answers: question.answers.map((answer, index) => ({
            id: answer.id || index + 1,
            text: answer.text,
            order: answer.order || index
          }))
        }));

        // Prepare questions without answers
        const questionData = questions.map(question => {
          const { answers, ...questionWithoutAnswers } = question;
          return questionWithoutAnswers;
        });

        const updatedPoll = await storage.updateSurveyStructure(
          pollId,
          { ...pollData, creatorId: poll.creatorId },
          questionData,
          questionAnswers
        );

        res.json(updatedPoll);
      } else {
        // Simple update of poll metadata (no structural changes)
        const updatedPoll = await storage.updateSurveyMetadata(pollId, req.body);
        res.json(updatedPoll);
      }
    } catch (error) {
      console.error("Error updating survey poll:", error);

      // Check if error is about structural edits being blocked
      if (error.message && error.message.includes("Cannot modify survey structure")) {
        return res.status(400).json({
          message: "Δεν μπορείτε να τροποποιήσετε τις ερωτήσεις ή απαντήσεις αφού έχουν υποβληθεί απαντήσεις",
          error: error.message
        });
      }

      res.status(500).json({ message: "Σφάλμα κατά την ενημέρωση της δημοσκόπησης", error: String(error) });
    }
  });

  // Poll location update utility route
  app.post("/api/admin/update-poll-locations", requireAuth, async (req, res) => {
    try {
      // Only allow admin users to run this utility
      if (req.user?.id !== 1) { // Assuming user ID 1 is admin
        return res.status(403).json({ message: "Only administrators can update poll locations" });
      }

      console.log("Starting poll locations update process");

      // Run the update process
      await updatePollLocations();

      res.json({
        success: true,
        message: "Poll locations update process completed successfully"
      });
    } catch (error) {
      console.error("Error updating poll locations:", error);
      res.status(500).json({
        message: "Error updating poll locations",
        error: String(error)
      });
    }
  });

  // Admin-only access control middleware
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Analytics Dashboard Endpoints (Public - Platform Statistics)
  // Note: These endpoints are publicly accessible as they show aggregate platform statistics
  app.get("/api/analytics/overview", async (req, res) => {
    try {
      const overview = await storage.getAnalyticsOverview();
      res.json(overview);
    } catch (error: any) {
      console.error("Error fetching analytics overview:", error);
      res.status(500).json({ error: "Failed to fetch analytics overview" });
    }
  });

  app.get("/api/analytics/poll-popularity", async (req, res) => {
    try {
      const popularity = await storage.getPollPopularityStats();
      res.json(popularity);
    } catch (error: any) {
      console.error("Error fetching poll popularity:", error);
      res.status(500).json({ error: "Failed to fetch poll popularity data" });
    }
  });

  app.get("/api/analytics/activity-trends", async (req, res) => {
    try {
      const trends = await storage.getActivityTrends();
      res.json(trends);
    } catch (error: any) {
      console.error("Error fetching activity trends:", error);
      res.status(500).json({ error: "Failed to fetch activity trends" });
    }
  });

  app.get("/api/analytics/usage-patterns", async (req, res) => {
    try {
      const patterns = await storage.getUsagePatterns();
      res.json(patterns);
    } catch (error: any) {
      console.error("Error fetching usage patterns:", error);
      res.status(500).json({ error: "Failed to fetch usage patterns" });
    }
  });

  // Admin Account Management Endpoints
  app.get("/api/admin/accounts", requireAdmin, async (req, res) => {
    try {
      const { status, search } = req.query;

      const filters = {
        status: status && status !== 'undefined' ? status as string : undefined,
        search: search && search !== 'undefined' ? search as string : undefined
      };

      const users = await storage.getAllUsersWithAccountInfo(filters);
      res.json(users);
    } catch (error: any) {
      console.error("Error fetching user accounts:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση των λογαριασμών χρηστών" });
    }
  });

  app.get("/api/admin/accounts/:userId/activity", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Μη έγκυρο αναγνωριστικό χρήστη" });
      }

      const activity = await storage.getUserAccountActivity(userId);
      res.json(activity);
    } catch (error: any) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση του ιστορικού δραστηριότητας" });
    }
  });

  app.post("/api/admin/accounts/:userId/ban", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Μη έγκυρο αναγνωριστικό χρήστη" });
      }

      const updatedUser = await storage.updateAccountStatus(userId, 'banned');
      res.json({
        success: true,
        message: "Ο λογαριασμός χρήστη έχει αποκλειστεί επιτυχώς",
        user: updatedUser
      });
    } catch (error: any) {
      console.error("Error banning user account:", error);
      res.status(500).json({ message: "Σφάλμα κατά τον αποκλεισμό του λογαριασμού χρήστη" });
    }
  });

  app.post("/api/admin/accounts/:userId/approve", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Μη έγκυρο αναγνωριστικό χρήστη" });
      }

      const updatedUser = await storage.updateAccountStatus(userId, 'active');
      res.json({
        success: true,
        message: "Ο λογαριασμός χρήστη έχει εγκριθεί επιτυχώς",
        user: updatedUser
      });
    } catch (error: any) {
      console.error("Error approving user account:", error);
      res.status(500).json({ message: "Σφάλμα κατά την έγκριση του λογαριασμού χρήστη" });
    }
  });

  // ============================================
  // GOV.GR BALLOT VOTING ROUTES
  // ============================================
  // These routes proxy to the Python ballot validation service
  // for verifying Gov.gr Solemn Declaration PDFs as certified ballots

  const multer = (await import('multer')).default;
  const ballotUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    }
  });

  // Generate a poll token for ballot voting
  app.post("/api/ballot/token", requireAuth, async (req, res) => {
    try {
      const { pollId } = req.body;

      if (!pollId) {
        return res.status(400).json({ message: "Poll ID is required" });
      }

      // Verify poll exists and supports ballot voting
      const poll = await storage.getPoll(parseInt(pollId));
      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }

      // Import ballot client
      const { generatePollToken } = await import('./utils/ballot-client');
      const tokenResponse = await generatePollToken(String(pollId));

      if (!tokenResponse) {
        return res.status(503).json({
          message: "Ballot service unavailable. Please try again later."
        });
      }

      res.json(tokenResponse);
    } catch (error) {
      console.error("Error generating ballot token:", error);
      res.status(500).json({ message: "Σφάλμα κατά τη δημιουργία token" });
    }
  });

  // Get ballot voting instructions
  app.get("/api/ballot/instructions", requireAuth, async (req, res) => {
    try {
      const { pollId, pollToken } = req.query;

      if (!pollId || !pollToken) {
        return res.status(400).json({ message: "Poll ID and token are required" });
      }

      const { getBallotInstructions } = await import('./utils/ballot-client');
      const instructions = await getBallotInstructions(
        String(pollId),
        String(pollToken)
      );

      if (!instructions) {
        return res.status(503).json({
          message: "Ballot service unavailable. Please try again later."
        });
      }

      res.json(instructions);
    } catch (error) {
      console.error("Error getting ballot instructions:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση οδηγιών" });
    }
  });

  // Upload and validate a ballot PDF
  app.post("/api/ballot/validate", requireAuth, ballotUpload.single('file'), async (req: any, res) => {
    try {
      const file = req.file;
      const { pollId, pollToken } = req.body;

      if (!file) {
        return res.status(400).json({ message: "PDF file is required" });
      }

      if (!pollId || !pollToken) {
        return res.status(400).json({ message: "Poll ID and token are required" });
      }

      // Verify poll exists
      const poll = await storage.getPoll(parseInt(pollId));
      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }

      if (!poll.isActive) {
        return res.status(400).json({ message: "Η ψηφοφορία έχει ολοκληρωθεί" });
      }

      // Validate via Python ballot service
      const { validateBallot } = await import('./utils/ballot-client');
      const result = await validateBallot(
        file.buffer,
        String(pollId),
        String(pollToken),
        file.originalname
      );

      if (result.success) {
        // Vote was recorded in Python service
        // Optionally sync to main DB for unified reporting
        console.log(`Ballot vote recorded for poll ${pollId}: ${result.vote_choice}`);

        return res.status(201).json({
          success: true,
          message: "Η ψήφος σας καταχωρήθηκε επιτυχώς μέσω Gov.gr",
          vote_choice: result.vote_choice,
          signer_name: result.signer_name,
        });
      } else {
        // Map rejection reasons to appropriate HTTP status
        const statusMap: Record<string, number> = {
          'invalid_signature': 403,
          'no_signature': 403,
          'unknown_signer': 403,
          'duplicate_file': 409,
          'already_voted': 409,
          'invalid_token': 400,
          'token_not_found': 400,
          'afm_not_found': 400,
          'vote_choice_not_found': 400,
          'pdf_read_error': 400,
        };

        const status = result.rejection_reason
          ? (statusMap[result.rejection_reason] || 400)
          : 400;

        return res.status(status).json({
          success: false,
          message: result.message,
          rejection_reason: result.rejection_reason,
        });
      }
    } catch (error) {
      console.error("Error validating ballot:", error);
      res.status(500).json({ message: "Σφάλμα κατά την επαλήθευση της ψήφου" });
    }
  });

  // Get ballot voting statistics
  app.get("/api/ballot/stats/:pollId", async (req, res) => {
    try {
      const pollId = req.params.pollId;

      const { getBallotStats } = await import('./utils/ballot-client');
      const stats = await getBallotStats(pollId);

      if (!stats) {
        return res.status(503).json({
          message: "Ballot service unavailable or no votes yet."
        });
      }

      res.json(stats);
    } catch (error) {
      console.error("Error getting ballot stats:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση στατιστικών" });
    }
  });

  // Check ballot service health
  app.get("/api/ballot/health", async (req, res) => {
    try {
      const { checkBallotServiceHealth } = await import('./utils/ballot-client');
      const isHealthy = await checkBallotServiceHealth();

      res.json({
        status: isHealthy ? 'healthy' : 'unavailable',
        service: 'ballot-validator'
      });
    } catch (error) {
      res.json({ status: 'unavailable', service: 'ballot-validator' });
    }
  });

  // One-time Gov.gr Identity Verification
  app.post("/api/user/verify-govgr", requireAuth, ballotUpload.single('file'), async (req: any, res) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "PDF file is required" });
      }

      // Verify identity via Python ballot service
      const { verifyIdentity } = await import('./utils/ballot-client');
      const result = await verifyIdentity(
        file.buffer,
        file.originalname
      );

      if (result.success) {
        // Check if this voter hash is already used by another account
        const voterHash = result.voter_hash || "";
        if (voterHash) {
          const existingUser = await storage.getUserByVoterHash(voterHash);
          if (existingUser && existingUser.id !== req.user.id) {
            return res.status(400).json({
              success: false,
              message: "Αυτή η ταυτότητα είναι ήδη συνδεδεμένη με άλλο λογαριασμό",
              rejection_reason: "already_verified"
            });
          }
        }

        // Update user record with verification info
        await storage.updateUser(req.user.id, {
          govgrVerified: true,
          govgrVerifiedAt: new Date(),
          govgrVoterHash: voterHash || "hash-missing",
        });

        return res.status(200).json({
          success: true,
          message: "Η ταυτότητά σας επαληθεύτηκε επιτυχώς μέσω Gov.gr",
          signer_name: result.signer_name,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message,
          rejection_reason: result.rejection_reason,
        });
      }
    } catch (error) {
      console.error("Error verifying identity:", error);
      res.status(500).json({ message: "Σφάλμα κατά την επαλήθευση ταυτότητας" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
