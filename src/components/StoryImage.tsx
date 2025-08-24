import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  Text,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { WordPressImage } from '../services/wordpressService';

interface StoryImageProps {
  image?: WordPressImage;
  width?: number | string;
  height?: number;
  borderRadius?: number;
  showCaption?: boolean;
  fallbackText?: string;
  lazyLoad?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export default function StoryImage({
  image,
  width = '100%',
  height = 200,
  borderRadius = 8,
  showCaption = false,
  fallbackText = 'No Image',
  lazyLoad = true
}: StoryImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [urlIndex, setUrlIndex] = useState(0);
  const imageRef = useRef<View>(null);

  // Get the best available image URL with resizing
  const getImageUrl = (targetWidth?: number) => {
    if (!image) return null;
    
    const sizes = image.media_details?.sizes;
    const originalUrl = image.source_url;
    
    // Create an array of URLs to try in order of preference
    const urlOptions: string[] = [];
    
    // Web-specific optimization: prefer smaller images for faster loading
    if (Platform.OS === 'web') {
      // On web, always prefer smaller images for better performance
      if (sizes?.thumbnail?.source_url) urlOptions.push(sizes.thumbnail.source_url);
      if (sizes?.medium?.source_url) urlOptions.push(sizes.medium.source_url);
      if (sizes?.woocommerce_thumbnail?.source_url) urlOptions.push(sizes.woocommerce_thumbnail.source_url);
    }
    
    // If we have a target width, try to get the closest size
    if (targetWidth && sizes) {
      // Find the best size for the target width
      const availableSizes = Object.values(sizes).filter(size => size.source_url);
      const bestSize = availableSizes.reduce((best, current) => {
        if (!best) return current;
        const bestDiff = Math.abs(best.width - targetWidth);
        const currentDiff = Math.abs(current.width - targetWidth);
        return currentDiff < bestDiff ? current : best;
      });
      
      if (bestSize && bestSize.width <= targetWidth * 1.5) {
        urlOptions.push(bestSize.source_url);
      }
    }
    
    // Fallback to optimized sizes
    if (sizes?.thumbnail?.source_url) urlOptions.push(sizes.thumbnail.source_url);
    if (sizes?.medium?.source_url) urlOptions.push(sizes.medium.source_url);
    if (sizes?.woocommerce_thumbnail?.source_url) urlOptions.push(sizes.woocommerce_thumbnail.source_url);
    if (sizes?.medium_large?.source_url) urlOptions.push(sizes.medium_large.source_url);
    if (sizes?.large?.source_url) urlOptions.push(sizes.large.source_url);
    if (sizes?.full?.source_url) urlOptions.push(sizes.full.source_url);
    
    // Add original URL as final fallback
    urlOptions.push(originalUrl);
    
    // Remove duplicates and return the first option
    const uniqueUrls = [...new Set(urlOptions)];
    return uniqueUrls[0] || originalUrl;
  };

  // Calculate target width based on props
  const targetWidth = typeof width === 'number' ? width : screenWidth * 0.9;
  const imageUrl = getImageUrl(targetWidth);
  
  // Get all available URLs for fallback
  const getAllUrls = () => {
    if (!image) return [];
    
    const sizes = image.media_details?.sizes;
    const urls: string[] = [];
    
    // Add all available sizes
    if (sizes?.thumbnail?.source_url) urls.push(sizes.thumbnail.source_url);
    if (sizes?.medium?.source_url) urls.push(sizes.medium.source_url);
    if (sizes?.woocommerce_thumbnail?.source_url) urls.push(sizes.woocommerce_thumbnail.source_url);
    if (sizes?.medium_large?.source_url) urls.push(sizes.medium_large.source_url);
    if (sizes?.large?.source_url) urls.push(sizes.large.source_url);
    if (sizes?.full?.source_url) urls.push(sizes.full.source_url);
    
    // Add original URL as final fallback
    if (image.source_url) urls.push(image.source_url);
    
    return [...new Set(urls)]; // Remove duplicates
  };
  
  const allUrls = getAllUrls();

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  // Lazy loading effect
  useEffect(() => {
    if (!lazyLoad || !imageRef.current) {
      setIsVisible(true);
      return;
    }

    // Only use IntersectionObserver on web
    if (Platform.OS === 'web' && typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        {
          rootMargin: '50px', // Start loading 50px before the image comes into view
          threshold: 0.1,
        }
      );

      if (imageRef.current) {
        observer.observe(imageRef.current);
      }

      return () => observer.disconnect();
    } else {
      // On React Native, load immediately
      setIsVisible(true);
    }
  }, [lazyLoad]);

  // Update current image URL when visible
  useEffect(() => {
    if (isVisible && allUrls.length > 0) {
      setCurrentImageUrl(allUrls[urlIndex]);
    }
  }, [isVisible, allUrls, urlIndex]);

  // Add timeout for image loading
  useEffect(() => {
    if (loading && currentImageUrl) {
      const timeout = setTimeout(() => {
        if (loading) {
          console.warn('🖼️ Image loading timeout:', currentImageUrl);
          // Try next URL instead of just failing
          handleError();
        }
      }, 5000); // Reduced to 5 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading, currentImageUrl]);

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    console.warn('🖼️ Image failed to load:', currentImageUrl);
    
    // Try next URL if available
    if (urlIndex < allUrls.length - 1) {
      setUrlIndex(prev => prev + 1);
      setLoading(true);
      setError(false);
      console.log('🔄 Trying next URL:', allUrls[urlIndex + 1]);
    } else {
      // No more URLs to try
      setLoading(false);
      setError(true);
    }
  };

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    setRetryCount(prev => prev + 1);
    setUrlIndex(0); // Reset to first URL
  };

  if (!imageUrl) {
    return (
      <View 
        ref={imageRef}
        style={[
          styles.fallbackContainer,
          { width, height, borderRadius }
        ]}
      >
        <Text style={styles.fallbackText}>{fallbackText}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View 
        ref={imageRef}
        style={[
          styles.fallbackContainer,
          { width, height, borderRadius }
        ]}
      >
        <Text style={styles.fallbackText}>{fallbackText}</Text>
        {retryCount < 2 && (
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>🔄 Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View 
      ref={imageRef}
      style={[styles.container, { width, height, borderRadius }]}
    >
      {!isVisible ? (
        // Placeholder while lazy loading
        <View style={[styles.placeholder, { borderRadius }]}>
          <ActivityIndicator size="small" color="#e42c29" />
        </View>
      ) : currentImageUrl ? (
        // Actual image
        <Image
          source={{ 
            uri: currentImageUrl,
            // Add cache and timeout settings
            cache: 'default',
            headers: Platform.OS === 'web' ? {
              'Cache-Control': 'max-age=3600', // Cache for 1 hour
              'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            } : {
              'Cache-Control': 'max-age=3600', // Cache for 1 hour
            }
          }}
          style={[styles.image, { borderRadius }]}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          resizeMode="cover"
          // Add timeout for loading
          fadeDuration={300}
          // Web-specific props
          {...(Platform.OS === 'web' && {
            crossOrigin: 'anonymous',
          })}
        />
      ) : (
        // Fallback
        <View style={[styles.placeholder, { borderRadius }]}>
          <Text style={styles.fallbackText}>{fallbackText}</Text>
        </View>
      )}
      
      {loading && isVisible && (
        <View style={[styles.loadingOverlay, { borderRadius }]}>
          <ActivityIndicator size="small" color="#e42c29" />
        </View>
      )}
      
      {showCaption && image?.caption?.rendered && (
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>
            {image.caption.rendered.replace(/<[^>]*>/g, '')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  placeholder: {
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  fallbackText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e42c29',
    borderRadius: 4,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  captionText: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 16,
  },
});
