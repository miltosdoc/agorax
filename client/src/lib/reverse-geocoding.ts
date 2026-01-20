import { useState, useEffect } from 'react';

interface GeocodingResult {
  municipality?: string;
  city?: string;
  town?: string;
  state?: string;
  region?: string;
  country?: string;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to get location information from coordinates using OpenStreetMap Nominatim API
 */
export function useReverseGeocoding(latitude: string | number | null, longitude: string | number | null): GeocodingResult {
  const [result, setResult] = useState<GeocodingResult>({
    loading: false,
    error: null
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchLocationDetails = async () => {
      if (!latitude || !longitude) {
        setResult({ loading: false, error: null });
        return;
      }
      
      setResult(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        // Try to fetch detailed location data from OpenStreetMap Nominatim API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`,
          {
            headers: {
              'Accept-Language': navigator.language,
              'User-Agent': 'AgoraX-Democracy-Platform',
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Geocoding failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (isMounted) {
          setResult({
            municipality: data.address?.municipality,
            city: data.address?.city,
            town: data.address?.town,
            state: data.address?.state,
            region: data.address?.region,
            country: data.address?.country,
            loading: false,
            error: null
          });
        }
      } catch (err) {
        console.error('Error fetching location details:', err);
        if (isMounted) {
          setResult({
            loading: false,
            error: err instanceof Error ? err.message : String(err)
          });
        }
      }
    };
    
    fetchLocationDetails();
    
    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);
  
  return result;
}

/**
 * Simple function to get the location name from reverse geocoding result
 */
export function getLocationName(geocodingResult: GeocodingResult): string {
  if (geocodingResult.loading) return 'Loading...';
  if (geocodingResult.error) return '';
  
  // Municipality or city or town
  const locality = geocodingResult.municipality || geocodingResult.city || geocodingResult.town || '';
  
  // Country
  const country = geocodingResult.country || '';
  
  if (locality && country) {
    return `${locality}, ${country}`;
  } else if (locality) {
    return locality;
  } else if (country) {
    return country;
  }
  
  return '';
}