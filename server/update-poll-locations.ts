import { db } from "./db";
import { polls } from "@shared/schema";
import { reverseGeocode } from "./utils/reverse-geocoding";
import { deriveGeoRegion } from "./utils/geo-region-detector";
import { eq } from "drizzle-orm";

/**
 * Helper script to update location data for existing polls that have coordinates but no location fields
 * This can be run manually or called from within the application
 */
export async function updatePollLocations(): Promise<void> {
  console.log("Starting to update poll locations...");
  
  // Find polls with coordinates but missing location data
  const pollsToUpdate = await db
    .select()
    .from(polls)
    .where(
      // Filter for geofenced polls that have coordinates and missing location data
      eq(polls.locationScope, "geofenced")
    )
    // We'll filter further in JavaScript since complex conditions are hard with Drizzle
    .then(results => results.filter(poll => 
      poll.centerLat && 
      poll.centerLng && 
      (!poll.locationCountry || !poll.locationRegion || !poll.locationCity)
    ));
  
  console.log(`Found ${pollsToUpdate.length} polls to update`);
  
  for (const poll of pollsToUpdate) {
    console.log(`Processing poll ${poll.id}: ${poll.title}`);
    
    // Skip if no coordinates
    if (!poll.centerLat || !poll.centerLng) {
      console.log(`Poll ${poll.id} has no coordinates, skipping`);
      continue;
    }
    
    // Get location data from coordinates
    try {
      console.log(`Getting location data for coordinates: ${poll.centerLat}, ${poll.centerLng}`);
      const locationData = await reverseGeocode(poll.centerLat, poll.centerLng);
      
      if (!locationData) {
        console.log(`No location data found for poll ${poll.id}`);
        continue;
      }
      
      console.log(`Found location data for poll ${poll.id}:`, locationData);
      
      // Get geoRegion
      const geoRegion = deriveGeoRegion(
        poll.centerLat,
        poll.centerLng,
        locationData.region,
        locationData.region
      );
      
      // Update poll with location data
      await db
        .update(polls)
        .set({
          // Set standardized location fields
          locationCity: locationData.city,
          locationRegion: locationData.region,
          locationCountry: locationData.country,
          
          // Set standardized location IDs
          locationCityId: locationData.cityId,
          locationRegionId: locationData.regionId,
          locationCountryId: locationData.countryId,
          
          // Set legacy fields for backward compatibility
          city: locationData.city,
          region: locationData.region,
          country: locationData.country,
          
          // Set standardized geographic region
          geoRegion
        })
        .where(eq(polls.id, poll.id));
      
      console.log(`Updated poll ${poll.id}`);
    } catch (error) {
      console.error(`Error updating poll ${poll.id}:`, error);
    }
  }
  
  console.log("Poll location update completed");
}