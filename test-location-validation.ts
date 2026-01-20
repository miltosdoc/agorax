// Quick test script for location validation
import { isUserEligibleForPoll } from "./server/utils/location-validator";

// Mock poll with region-only restriction
const mockPoll = {
  id: 50,
  title: "Test Region Poll",
  description: "This poll is restricted to the Epirus region only",
  locationScope: "region",
  locationRegion: "Ήπειρος",
  location_region_id: "epirus"
};

// Mock user in a city within the region
const mockUser = {
  id: 89,
  username: "testuser",
  locationConfirmed: true,
  region: "Ήπειρος",
  region_id: "epirus",
  city: "Ιωάννινα",
  city_id: "ioannina",
  country: "Ελλάδα",
  country_id: "GR"
};

// Test eligibility
const result = isUserEligibleForPoll(mockPoll as any, mockUser as any);
console.log("Eligibility result:", result);

// Test with a user from a different region
const differentRegionUser = {
  ...mockUser,
  region: "Αττική",
  region_id: "attica",
  city: "Αθήνα",
  city_id: "athens"
};
const differentRegionResult = isUserEligibleForPoll(mockPoll as any, differentRegionUser as any);
console.log("Different region eligibility result:", differentRegionResult);

// Test with a poll restricted to a specific city
const cityRestrictedPoll = {
  ...mockPoll,
  locationScope: "city",
  locationCity: "Αθήνα",
  location_city_id: "athens"
};
const cityRestrictedResult = isUserEligibleForPoll(cityRestrictedPoll as any, mockUser as any);
console.log("City restricted eligibility result:", cityRestrictedResult);

// Test with a user from the same city
const matchingCityUser = {
  ...mockUser,
  city: "Αθήνα",
  city_id: "athens"
};
const matchingCityResult = isUserEligibleForPoll(cityRestrictedPoll as any, matchingCityUser as any);
console.log("Matching city eligibility result:", matchingCityResult);