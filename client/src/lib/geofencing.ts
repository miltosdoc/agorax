/**
 * Geofencing utilities for location-based polls
 */

/**
 * Location information object returned from reverse geocoding
 */
export interface LocationInfo {
  city: string;      // Display name in local language
  region: string;    // Display name in local language 
  country: string;   // Display name in local language
  cityId: string;    // Standardized English ID
  regionId: string;  // Standardized English ID
  countryId: string; // Standardized English ID (ISO code)
  displayName: string;
}

/**
 * Converts a string to a standardized ID
 * - Removes special characters
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 */
function convertToId(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^\w\s-]/g, "")        // Remove special characters
    .replace(/\s+/g, "-")            // Replace spaces with hyphens
    .replace(/-+/g, "-");            // Replace multiple hyphens with single
}

/**
 * Convert latitude and longitude to city, region, and country using OpenStreetMap Nominatim API
 * @param latitude Latitude in decimal degrees
 * @param longitude Longitude in decimal degrees
 * @returns Promise with location information or null if geocoding failed
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationInfo | null> {
  try {
    // Make two requests:
    // 1. Get localized names for display (user's language)
    // 2. Get English names for standardized IDs
    
    // Request localized names for display
    const localizedResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
      {
        headers: {
          'Accept-Language': navigator.language, // Use browser language for display
          'User-Agent': 'AgoraX-Democracy-Platform',
        }
      }
    );
    
    // Request English names for IDs
    const englishResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
      {
        headers: {
          'Accept-Language': 'en', // Always get English for IDs
          'User-Agent': 'AgoraX-Democracy-Platform',
        }
      }
    );
    
    if (!localizedResponse.ok || !englishResponse.ok) {
      throw new Error(`Geocoding failed: ${localizedResponse.status}, ${englishResponse.status}`);
    }
    
    const localizedData = await localizedResponse.json();
    const englishData = await englishResponse.json();
    
    if (!localizedData?.address || !englishData?.address) {
      throw new Error('Invalid geocoding response');
    }
    
    // Extract localized components for display
    const city = localizedData.address.city || 
                 localizedData.address.town || 
                 localizedData.address.village || 
                 localizedData.address.hamlet || 
                 localizedData.address.suburb ||
                 localizedData.address.municipality ||
                 'Unknown';
                 
    const region = localizedData.address.state || 
                   localizedData.address.county || 
                   localizedData.address.region || 
                   localizedData.address.province ||
                   'Unknown';
                   
    const country = localizedData.address.country || 'Unknown';
    
    // Extract English components for IDs
    const englishCity = englishData.address.city || 
                 englishData.address.town || 
                 englishData.address.village || 
                 englishData.address.hamlet || 
                 englishData.address.suburb ||
                 englishData.address.municipality ||
                 'unknown';
                 
    const englishRegion = englishData.address.state || 
                   englishData.address.county || 
                   englishData.address.region || 
                   englishData.address.province ||
                   'unknown';
                   
    const englishCountry = englishData.address.country_code?.toUpperCase() || 
                          englishData.address.country || 
                          'UNKNOWN';
    
    // Create standardized IDs
    const cityId = convertToId(englishCity);
    const regionId = convertToId(englishRegion);
    const countryId = englishData.address.country_code?.toUpperCase() || convertToId(englishCountry);
    
    return {
      // Localized display names
      city,
      region,
      country,
      // Standardized English IDs
      cityId,
      regionId,
      countryId,
      displayName: localizedData.display_name || `${city}, ${region}, ${country}`
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param lat1 Latitude of first point in decimal degrees
 * @param lon1 Longitude of first point in decimal degrees
 * @param lat2 Latitude of second point in decimal degrees
 * @param lon2 Longitude of second point in decimal degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Earth's radius in kilometers
  const R = 6371;
  
  // Convert degrees to radians
  const toRad = (deg: number): number => deg * Math.PI / 180;
  
  // Get differences in radians
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  // Haversine formula
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Distance in kilometers
  return R * c;
}

/**
 * Check if a user is within a geofenced area
 * @param userLat User's latitude
 * @param userLng User's longitude
 * @param centerLat Center latitude of geofence
 * @param centerLng Center longitude of geofence
 * @param radiusKm Radius of geofence in kilometers
 * @returns true if user is within the geofence, false otherwise
 */
export function isWithinGeofence(
  userLat: number,
  userLng: number,
  centerLat: number,
  centerLng: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(userLat, userLng, centerLat, centerLng);
  return distance <= radiusKm;
}

/**
 * Format distance to a human-readable string
 * @param distanceKm Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    // Convert to meters for distances less than 1km
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  } else if (distanceKm < 10) {
    // Show one decimal place for distances under 10km
    return `${distanceKm.toFixed(1)} km`;
  } else {
    // Round to whole numbers for larger distances
    return `${Math.round(distanceKm)} km`;
  }
}