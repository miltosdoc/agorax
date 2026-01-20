import { useEffect } from 'react';

interface DynamicHeadProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  url?: string;
}

/**
 * Component to dynamically update meta tags for social sharing
 */
export function DynamicHead({ 
  title = "AgoraX - Πλατφόρμα Ψηφιακής Δημοκρατίας",
  description = "Ψηφιακή πλατφόρμα για μια πιο ανοιχτή και συμμετοχική διακυβέρνηση.",
  imageUrl = "/logo-share.png",
  url = "https://agorax.org"
}: DynamicHeadProps) {
  
  useEffect(() => {
    // Update Open Graph meta tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', imageUrl);
    updateMetaTag('og:url', url || window.location.href);
    
    // Update Twitter card meta tags
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', imageUrl);
    
    // Update page title
    document.title = title;
    
    // Cleanup function to reset meta tags when component unmounts
    return () => {
      // Reset to default values
      updateMetaTag('og:title', "AgoraX - Πλατφόρμα Ψηφιακής Δημοκρατίας");
      updateMetaTag('og:description', "Ψηφιακή πλατφόρμα για μια πιο ανοιχτή και συμμετοχική διακυβέρνηση.");
      updateMetaTag('og:image', "/logo-share.png");
      updateMetaTag('og:url', "https://agorax.org");
      updateMetaTag('twitter:title', "AgoraX - Πλατφόρμα Ψηφιακής Δημοκρατίας");
      updateMetaTag('twitter:description', "Ψηφιακή πλατφόρμα για μια πιο ανοιχτή και συμμετοχική διακυβέρνηση.");
      updateMetaTag('twitter:image', "/logo-share.png");
      document.title = "AgoraX - Πλατφόρμα Ψηφιακής Δημοκρατίας";
    };
  }, [title, description, imageUrl, url]);
  
  // Helper function to update or create meta tags
  const updateMetaTag = (property: string, content: string) => {
    let meta = document.querySelector(`meta[property="${property}"]`);
    
    if (meta) {
      // Update existing tag
      meta.setAttribute('content', content);
    } else {
      // Create new tag if it doesn't exist
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    }
  };
  
  // This component doesn't render anything
  return null;
}