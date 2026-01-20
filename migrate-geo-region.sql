-- Add geoRegion column to polls table
ALTER TABLE polls ADD COLUMN IF NOT EXISTS geo_region TEXT;

-- Update existing records to set geoRegion based on coordinates where possible
UPDATE polls
SET geo_region = 
  CASE 
    -- Macedonia and Thrace region
    WHEN (
      center_lat::NUMERIC >= 40.2 AND center_lat::NUMERIC <= 41.7 AND 
      center_lng::NUMERIC >= 22.5 AND center_lng::NUMERIC <= 26.5
    ) THEN 'macedonia-and-thrace'
    
    -- Aegean region
    WHEN (
      center_lat::NUMERIC >= 36.0 AND center_lat::NUMERIC <= 41.0 AND 
      center_lng::NUMERIC >= 24.0 AND center_lng::NUMERIC <= 28.0
    ) THEN 'aegean'
    
    -- Attica region
    WHEN (
      center_lat::NUMERIC >= 37.8 AND center_lat::NUMERIC <= 38.1 AND 
      center_lng::NUMERIC >= 23.6 AND center_lng::NUMERIC <= 24.1
    ) THEN 'attica'
    
    -- Default to null if no matching region
    ELSE NULL
  END
WHERE center_lat IS NOT NULL AND center_lng IS NOT NULL AND geo_region IS NULL;

-- Also try to update based on text region fields
UPDATE polls
SET geo_region = 
  CASE
    WHEN LOWER(REPLACE(location_region, ' ', '-')) = 'aegean' THEN 'aegean'
    WHEN LOWER(REPLACE(location_region, ' ', '-')) = 'attica' THEN 'attica'
    WHEN LOWER(REPLACE(location_region, ' ', '-')) = 'macedonia-and-thrace' THEN 'macedonia-and-thrace'
    WHEN LOWER(REPLACE(location_region, ' ', '-')) = 'central-macedonia' THEN 'central-macedonia'
    WHEN LOWER(REPLACE(location_region, ' ', '-')) = 'western-macedonia' THEN 'western-macedonia'
    ELSE geo_region  -- Keep existing value if set
  END
WHERE geo_region IS NULL AND location_region IS NOT NULL;

-- Try legacy region field if still null
UPDATE polls
SET geo_region = 
  CASE
    WHEN LOWER(REPLACE(region, ' ', '-')) = 'aegean' THEN 'aegean'
    WHEN LOWER(REPLACE(region, ' ', '-')) = 'attica' THEN 'attica'
    WHEN LOWER(REPLACE(region, ' ', '-')) = 'macedonia-and-thrace' THEN 'macedonia-and-thrace'
    WHEN LOWER(REPLACE(region, ' ', '-')) = 'central-macedonia' THEN 'central-macedonia'
    WHEN LOWER(REPLACE(region, ' ', '-')) = 'western-macedonia' THEN 'western-macedonia'
    ELSE geo_region  -- Keep existing value if set
  END
WHERE geo_region IS NULL AND region IS NOT NULL;