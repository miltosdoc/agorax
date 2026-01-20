/**
 * Utility to standardize and detect geographic regions for polls
 * This helps with location filtering by providing a consistent identifier
 */

interface RegionBoundary {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  name: string;  // Standardized name
}

// Define geographic regions with their coordinate boundaries
const GREEK_REGIONS: RegionBoundary[] = [
  // Macedonia and Thrace should come first since it's important and sometimes overlaps with Aegean
  {
    name: 'macedonia-and-thrace',
    minLat: 40.2,
    maxLat: 41.7,
    minLng: 22.5,
    maxLng: 26.5
  },
  {
    name: 'central-macedonia',
    minLat: 40.1,
    maxLat: 41.7,
    minLng: 22.0,
    maxLng: 23.9
  },
  {
    name: 'western-macedonia',
    minLat: 39.9,
    maxLat: 40.9,
    minLng: 21.0,
    maxLng: 22.2
  },
  {
    name: 'attica',
    minLat: 37.8,
    maxLat: 38.1,
    minLng: 23.6,
    maxLng: 24.1
  },
  // Aegean should come last since it has broad boundaries that may overlap with others
  {
    name: 'aegean',
    minLat: 36.0,
    maxLat: 41.0,
    minLng: 24.0,
    maxLng: 28.0
  }
];

// Map of common region names to standardized identifiers
const REGION_NAME_MAP: Record<string, string> = {
  // Greek regions
  'attica': 'attica',
  'αττική': 'attica',
  'attiki': 'attica',
  'αττικη': 'attica',
  'atiki': 'attica',
  
  'aegean': 'aegean',
  'αιγαίο': 'aegean',
  'aigaio': 'aegean',
  'αιγαιο': 'aegean',
  
  'macedonia and thrace': 'macedonia-and-thrace',
  'macedonia-and-thrace': 'macedonia-and-thrace',
  'μακεδονία και θράκη': 'macedonia-and-thrace',
  'makedonia kai thraki': 'macedonia-and-thrace',
  'μακεδονια και θρακη': 'macedonia-and-thrace',
  'eastern macedonia and thrace': 'macedonia-and-thrace',
  
  'central macedonia': 'central-macedonia',
  'central-macedonia': 'central-macedonia',
  'κεντρική μακεδονία': 'central-macedonia',
  'kentriki makedonia': 'central-macedonia',
  'κεντρικη μακεδονια': 'central-macedonia',
  
  'western macedonia': 'western-macedonia',
  'western-macedonia': 'western-macedonia',
  'δυτική μακεδονία': 'western-macedonia',
  'dytiki makedonia': 'western-macedonia',
  'δυτικη μακεδονια': 'western-macedonia',
  
  // Cities mapped to their regions
  'kavala': 'macedonia-and-thrace',
  'καβάλα': 'macedonia-and-thrace',
  'kavala municipality': 'macedonia-and-thrace'
};

/**
 * Determines the standardized geographic region from coordinates
 * 
 * @param lat Latitude coordinate
 * @param lng Longitude coordinate 
 * @returns Standardized region name or undefined if not found
 */
export function detectRegionFromCoordinates(lat: number | string | null | undefined, lng: number | string | null | undefined): string | undefined {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return undefined;
  }
  
  // Convert string coordinates to numbers if needed
  const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;
  const longitude = typeof lng === 'string' ? parseFloat(lng) : lng;
  
  // Check if coordinates are valid numbers
  if (isNaN(latitude) || isNaN(longitude)) {
    return undefined;
  }
  
  // Find matching region
  const matchingRegion = GREEK_REGIONS.find(region => 
    latitude >= region.minLat && 
    latitude <= region.maxLat && 
    longitude >= region.minLng && 
    longitude <= region.maxLng
  );
  
  return matchingRegion?.name;
}

/**
 * Normalizes a region name from any format to our standardized format
 * 
 * @param regionName The input region name (can be in various formats)
 * @returns Standardized region name or undefined if not recognized
 */
export function normalizeRegionName(regionName: string | null | undefined): string | undefined {
  if (!regionName) {
    return undefined;
  }
  
  // Normalize to lowercase and remove extra spaces
  const normalized = regionName.trim().toLowerCase();
  
  // Check direct mapping first
  if (REGION_NAME_MAP[normalized]) {
    return REGION_NAME_MAP[normalized];
  }
  
  // Try with dashes instead of spaces
  const dashedVersion = normalized.replace(/\s+/g, '-');
  if (REGION_NAME_MAP[dashedVersion]) {
    return REGION_NAME_MAP[dashedVersion];
  }
  
  // Try with spaces instead of dashes
  const spacedVersion = normalized.replace(/-+/g, ' ');
  if (REGION_NAME_MAP[spacedVersion]) {
    return REGION_NAME_MAP[spacedVersion];
  }
  
  // No match found
  return undefined;
}

/**
 * Derives the standardized geoRegion value from all available location data
 * This handles both coordinates and text fields in a unified way
 * 
 * @param centerLat Latitude coordinate
 * @param centerLng Longitude coordinate
 * @param locationRegion Text region name from input
 * @param region Legacy region name field
 * @returns Standardized geoRegion value
 */
export function deriveGeoRegion(
  centerLat: number | string | null | undefined,
  centerLng: number | string | null | undefined,
  locationRegion?: string | null,
  region?: string | null
): string | undefined {
  // First try to get region from coordinates
  const regionFromCoords = detectRegionFromCoordinates(centerLat, centerLng);
  if (regionFromCoords) {
    return regionFromCoords;
  }
  
  // Next try from locationRegion field (newer field)
  if (locationRegion) {
    const normalized = normalizeRegionName(locationRegion);
    if (normalized) {
      return normalized;
    }
  }
  
  // Finally try from legacy region field
  if (region) {
    const normalized = normalizeRegionName(region);
    if (normalized) {
      return normalized;
    }
  }
  
  // Could not determine region
  return undefined;
}