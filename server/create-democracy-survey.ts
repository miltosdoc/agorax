
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { DatabaseStorage } from "./storage";

async function createDemocracySurvey() {
  try {
    // Find the user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, "miltos2006@gmail.com"))
      .limit(1);

    if (!user) {
      console.error("User with email miltos2006@gmail.com not found");
      process.exit(1);
    }

    const storage = new DatabaseStorage();

    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const surveyData = {
      poll: {
        title: "Δημοσκόπηση: «Τι είναι πραγματικά Δημοκρατία;»",
        description: "Σκοπός: Να καταγραφεί πώς οι πολίτες αντιλαμβάνονται τη δημοκρατία, την αντιπροσώπευση και τη λειτουργία των θεσμών — χωρίς φανατισμό, με δημοσκοπικού τύπου ερωτήσεις που προκαλούν ήπιο αναστοχασμό.",
        category: "Πολιτική",
        startDate: now,
        endDate: endDate,
        visibility: "public" as const,
        showResults: true,
        allowComments: true,
        requireVerification: false,
        creatorId: user.id,
        isActive: true,
        locationScope: "global" as const,
        pollType: "surveyPoll" as const,
        allowExtension: true,
        communityMode: false,
        centerLat: null,
        centerLng: null,
        radiusKm: null,
        groupId: null
      },
      questions: [
        // Α. Βασική εικόνα
        {
          id: 1,
          text: "Πιστεύετε ότι το σημερινό πολιτικό σύστημα της Ελλάδας είναι πραγματικά δημοκρατικό;",
          questionType: "singleChoice" as const,
          required: true,
          order: 0,
          answers: [
            { id: 1, text: "Ναι, απολύτως — λειτουργεί δημοκρατικά", order: 0 },
            { id: 2, text: "Ναι, αλλά με αρκετές αδυναμίες", order: 1 },
            { id: 3, text: "Μάλλον όχι — η δημοκρατία είναι τυπική, όχι ουσιαστική", order: 2 },
            { id: 4, text: "Όχι — πρόκειται περισσότερο για σύστημα εξουσίας με εκλογές", order: 3 },
            { id: 5, text: "ΔΓ/ΔΑ", order: 4 },
          ],
        },
        {
          id: 2,
          text: "Πόσο συχνά αισθάνεστε ότι συμμετέχετε ουσιαστικά στις αποφάσεις που επηρεάζουν τη ζωή σας;",
          questionType: "singleChoice" as const,
          required: true,
          order: 1,
          answers: [
            { id: 6, text: "Συχνά (διαβουλεύσεις, τοπικές διαδικασίες, πρωτοβουλίες)", order: 0 },
            { id: 7, text: "Μερικές φορές (κυρίως στις εκλογές)", order: 1 },
            { id: 8, text: "Σπάνια — οι αποφάσεις λαμβάνονται χωρίς εμένα", order: 2 },
            { id: 9, text: "Ποτέ — απλώς ενημερώνομαι εκ των υστέρων", order: 3 },
            { id: 10, text: "ΔΓ/ΔΑ", order: 4 },
          ],
        },
        
        // Β. Αντιπροσώπευση ≠ Δημοκρατία;
        {
          id: 3,
          text: "Όταν ψηφίζετε στις εκλογές, τι πιστεύετε ότι κάνετε στην πράξη;",
          questionType: "singleChoice" as const,
          required: true,
          order: 2,
          answers: [
            { id: 11, text: "Επιλέγω ανθρώπους που θα εφαρμόσουν τη βούληση των πολιτών", order: 0 },
            { id: 12, text: "Εκχωρώ προσωρινά την εξουσία μου σε επαγγελματίες πολιτικούς", order: 1 },
            { id: 13, text: "Συμμετέχω ενεργά στη διακυβέρνηση", order: 2 },
            { id: 14, text: "Δεν έχει μεγάλη σημασία — όποιος κι αν εκλεγεί, το σύστημα μένει ίδιο", order: 3 },
            { id: 15, text: "ΔΓ/ΔΑ", order: 4 },
          ],
        },
        {
          id: 4,
          text: "Ποια δήλωση σάς εκφράζει περισσότερο;",
          questionType: "singleChoice" as const,
          required: true,
          order: 3,
          answers: [
            { id: 16, text: "Η δημοκρατία είναι η εκλογή αντιπροσώπων που νομοθετούν για εμάς", order: 0 },
            { id: 17, text: "Η δημοκρατία είναι η άμεση συμμετοχή των πολιτών στη λήψη των νόμων", order: 1 },
            { id: 18, text: "Συνδυασμός των δύο, αλλά σήμερα η συμμετοχή των πολιτών είναι ανεπαρκής", order: 2 },
            { id: 19, text: "Δεν υπάρχει πραγματική δημοκρατία — μόνο κυβερνήσεις με εκλογική νομιμοποίηση", order: 3 },
            { id: 20, text: "ΔΓ/ΔΑ", order: 4 },
          ],
        },
        {
          id: 5,
          text: "Στην πράξη, εκλέγουμε τους νόμους μας ή τους νομοθέτες μας;",
          questionType: "singleChoice" as const,
          required: true,
          order: 4,
          answers: [
            { id: 21, text: "Τους νόμους", order: 0 },
            { id: 22, text: "Τους νομοθέτες", order: 1 },
            { id: 23, text: "Και τα δύο/Κάτι ενδιάμεσο", order: 2 },
            { id: 24, text: "ΔΓ/ΔΑ", order: 3 },
          ],
        },
        {
          id: 6,
          text: "Οι εκλεγμένοι αντιπρόσωποι νομοθετούν σύμφωνα με τη βούληση της πλειοψηφίας;",
          questionType: "singleChoice" as const,
          required: true,
          order: 5,
          answers: [
            { id: 25, text: "Πάντα", order: 0 },
            { id: 26, text: "Συχνά", order: 1 },
            { id: 27, text: "Μερικές φορές", order: 2 },
            { id: 28, text: "Σπάνια/Ποτέ", order: 3 },
            { id: 29, text: "ΔΓ/ΔΑ", order: 4 },
          ],
        },
        
        // Γ. Διάκριση των εξουσιών & διαφθορά
        {
          id: 7,
          text: "Πόσο εμπιστεύεστε ότι η διάκριση των εξουσιών (Βουλή–Κυβέρνηση–Δικαιοσύνη) αποτρέπει κατάχρηση εξουσίας;",
          questionType: "singleChoice" as const,
          required: true,
          order: 6,
          answers: [
            { id: 30, text: "Απόλυτα — οι θεσμοί λειτουργούν ανεξάρτητα", order: 0 },
            { id: 31, text: "Αρκετά — υπάρχουν προβλήματα, αλλά τηρούνται κάποιες ισορροπίες", order: 1 },
            { id: 32, text: "Λίγο — η εκτελεστική επηρεάζει αισθητά τους άλλους θεσμούς", order: 2 },
            { id: 33, text: "Καθόλου — η διάκριση υπάρχει κυρίως στα χαρτιά", order: 3 },
            { id: 34, text: "ΔΓ/ΔΑ", order: 4 },
          ],
        },
        {
          id: 8,
          text: "Σε ποιο βαθμό η διαφθορά οφείλεται σε «κακούς ανθρώπους» ή σε δομή του συστήματος;",
          questionType: "singleChoice" as const,
          required: true,
          order: 7,
          answers: [
            { id: 35, text: "Κυρίως ατομική ανηθικότητα", order: 0 },
            { id: 36, text: "Συνδυασμός ατομικών και θεσμικών αδυναμιών", order: 1 },
            { id: 37, text: "Κυρίως σύστημα που ευνοεί συγκέντρωση/ατιμωρησία", order: 2 },
            { id: 38, text: "Δεν υπάρχει ουσιαστική διαφθορά — υπερβολές των ΜΜΕ", order: 3 },
            { id: 39, text: "ΔΓ/ΔΑ", order: 4 },
          ],
        },
        {
          id: 9,
          text: 'Συμφωνείτε ή διαφωνείτε: «Η αντιπροσωπευτική δημοκρατία στην πράξη λειτουργεί σαν εκλεγμένη ολιγαρχία».',
          questionType: "singleChoice" as const,
          required: true,
          order: 8,
          answers: [
            { id: 40, text: "Συμφωνώ απόλυτα", order: 0 },
            { id: 41, text: "Μάλλον συμφωνώ", order: 1 },
            { id: 42, text: "Ούτε–ούτε", order: 2 },
            { id: 43, text: "Μάλλον διαφωνώ", order: 3 },
            { id: 44, text: "Διαφωνώ απόλυτα", order: 4 },
            { id: 45, text: "ΔΓ/ΔΑ", order: 5 },
          ],
        },
        
        // Δ. Λύσεις & θεσμικές προτιμήσεις
        {
          id: 10,
          text: "Ποιο εργαλείο θα κάνατε πιο ισχυρό στην Ελλάδα; (Επιλέξτε ένα)",
          questionType: "singleChoice" as const,
          required: true,
          order: 9,
          answers: [
            { id: 46, text: "Δεσμευτικά δημοψηφίσματα για σημαντικούς νόμους", order: 0 },
            { id: 47, text: "Κληρωτές επιτροπές πολιτών που αξιολογούν/φιλτράρουν νομοσχέδια", order: 1 },
            { id: 48, text: "Ψηφιακή συμμετοχή με ψηφοφορία σε άρθρα νομοσχεδίων (με μητρώο διαφάνειας)", order: 2 },
            { id: 49, text: "Υποχρεωτικά μητρώα λόμπι & ιχνηλασιμότητα τροπολογιών", order: 3 },
            { id: 50, text: "Ενίσχυση ανεξαρτησίας Δικαιοσύνης/Αρχών με θητείες χωρίς κυβερνητικό έλεγχο", order: 4 },
            { id: 51, text: "Κανένα — το υπάρχον πλαίσιο επαρκεί", order: 5 },
            { id: 52, text: "ΔΓ/ΔΑ", order: 6 },
          ],
        },
        {
          id: 11,
          text: "Αν αύριο αλλάζατε ένα πράγμα στη λειτουργία του κράτους, τι θα διαλέγατε;",
          questionType: "singleChoice" as const,
          required: true,
          order: 10,
          answers: [
            { id: 53, text: "Περισσότερο άμεσος έλεγχος αποφάσεων από τους πολίτες", order: 0 },
            { id: 54, text: "Αλλαγή προσώπων, όχι θεσμών (το θέμα είναι ποιοι κυβερνούν)", order: 1 },
            { id: 55, text: "Ισχυρότερη ανεξαρτησία Δικαιοσύνης και ΜΜΕ", order: 2 },
            { id: 56, text: "Τίποτα — οι θεσμοί λειτουργούν επαρκώς", order: 3 },
            { id: 57, text: "ΔΓ/ΔΑ", order: 4 },
          ],
        },
        
        // Ε. Τεχνολογία & ΤΝ (AI)
        {
          id: 12,
          text: "Μπορεί η Τεχνητή Νοημοσύνη να βοηθήσει μια πιο άμεση/διαφανή δημοκρατία;",
          questionType: "singleChoice" as const,
          required: true,
          order: 11,
          answers: [
            { id: 58, text: "Ναι — μπορεί να κάνει συμμετοχή μαζική & ιχνηλάσιμη", order: 0 },
            { id: 59, text: "Ίσως — με αυστηρή εποπτεία, ανοικτό κώδικα & έλεγχο μεροληψιών", order: 1 },
            { id: 60, text: "Όχι — κίνδυνος τεχνοκρατίας/χειραγώγησης", order: 2 },
            { id: 61, text: "ΔΓ/ΔΑ", order: 3 },
          ],
        },
        {
          id: 13,
          text: "Θα στηρίζατε πλατφόρμα όπου οι πολίτες ψηφίζουν άρθρα νομοσχεδίων (με έλεγχο ταυτοπροσωπίας) και το αποτέλεσμα είναι δεσμευτικό πάνω από ένα όριο συμμετοχής;",
          questionType: "singleChoice" as const,
          required: true,
          order: 12,
          answers: [
            { id: 62, text: "Ναι", order: 0 },
            { id: 63, text: "Ναι, αλλά μόνο συμβουλευτικά (μη δεσμευτικά)", order: 1 },
            { id: 64, text: "Όχι", order: 2 },
            { id: 65, text: "ΔΓ/ΔΑ", order: 3 },
          ],
        },
      ],
    };

    const result = await storage.createSurveyPoll(
      surveyData.poll,
      surveyData.questions,
      surveyData.questions.map(q => ({
        questionId: q.id,
        answers: q.answers
      }))
    );

    console.log("Democracy survey poll created successfully!");
    console.log("Poll ID:", result.id);
    console.log("Title:", result.title);
    console.log("Total questions:", surveyData.questions.length);
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating democracy survey:", error);
    process.exit(1);
  }
}

createDemocracySurvey();
