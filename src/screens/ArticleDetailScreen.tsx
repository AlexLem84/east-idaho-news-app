import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { StackScreenProps } from '@react-navigation/stack';
import wordpressService, { WordPressPost } from '../services/wordpressService';
import analyticsService from '../services/analyticsService';
import { RootStackParamList } from '../types/navigation';
import StoryImage from '../components/StoryImage';

type ArticleDetailScreenProps = StackScreenProps<RootStackParamList, 'ArticleDetail'>;

export default function ArticleDetailScreen({ route, navigation }: ArticleDetailScreenProps) {
  const { article, category } = route.params;
  const [loading, setLoading] = useState(true);
  const [readTime, setReadTime] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Track article view start
    analyticsService.trackArticleView(article, category);
    
    // Set navigation title
    navigation.setOptions({
      title: article.title.rendered.substring(0, 30) + '...',
      headerRight: () => (
        <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Share</Text>
        </TouchableOpacity>
      ),
    });

    // Start read time tracking
    const interval = setInterval(() => {
      setReadTime(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);

    // Set loading to false after a short delay to simulate content loading
    const loadingTimer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => {
      clearInterval(interval);
      clearTimeout(loadingTimer);
      // Track final read time and completion rate
      const finalReadTime = Math.floor((Date.now() - startTime.current) / 1000);
      const completionRate = Math.min(scrollProgress, 100);
      analyticsService.trackArticleReadTime(article.id, finalReadTime, completionRate);
    };
  }, [article, category, navigation, scrollProgress]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this article: ${article.title.rendered}\n\nRead more at: ${article.link}`,
        title: article.title.rendered,
        url: article.link,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share article');
    }
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const progress = (contentOffset.y / (contentSize.height - layoutMeasurement.height)) * 100;
    setScrollProgress(Math.max(0, Math.min(100, progress)));
  };

  const renderArticleContent = () => {
    const content = wordpressService.stripHtml(article.content.rendered);
    const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
    
    return (
      <View style={styles.contentContainer}>
        {paragraphs.map((paragraph, index) => (
          <Text key={index} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}
      </View>
    );
  };

  const renderComments = () => {
    if (!showComments) return null;

    // OpenWeb comments widget HTML
    const commentsHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0; 
              padding: 16px; 
              background: #f5f5f5;
            }
            .comments-container {
              background: white;
              border-radius: 8px;
              padding: 16px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .comments-header {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 16px;
              color: #333;
            }
            .openweb-placeholder {
              text-align: center;
              padding: 40px 20px;
              color: #666;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="comments-container">
            <div class="comments-header">Comments</div>
            <div class="openweb-placeholder">
              OpenWeb comments widget would be embedded here.<br>
              This integrates with your existing commenting system.
            </div>
          </div>
        </body>
      </html>
    `;

    return (
      <View style={styles.commentsContainer}>
        <WebView
          source={{ html: commentsHTML }}
          style={styles.commentsWebView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.commentsLoading}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.commentsLoadingText}>Loading comments...</Text>
            </View>
          )}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading article...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Article Header */}
        <View style={styles.header}>
          <Text style={styles.category}>{category.toUpperCase()}</Text>
          <Text style={styles.title}>{article.title.rendered}</Text>
          <View style={styles.meta}>
            <Text style={styles.author}>
              By {article.meta_fields?._dc_author?.[0] || 'East Idaho News'}
            </Text>
            <Text style={styles.date}>
              {wordpressService.formatDate(article.date)}
            </Text>
          </View>
        </View>

        {/* Featured Image */}
        {article._embedded?.['wp:featuredmedia']?.[0] && (
          <View style={styles.featuredImageContainer}>
            <StoryImage
              image={article._embedded['wp:featuredmedia'][0]}
              height={250}
              borderRadius={0}
              showCaption={true}
              fallbackText="Featured Image"
            />
          </View>
        )}

        {/* Reading Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${scrollProgress}%` }]} />
        </View>

        {/* Article Content */}
        {renderArticleContent()}

        {/* Article Footer */}
        <View style={styles.footer}>
          <Text style={styles.readTime}>Read time: {Math.floor(readTime / 60)}m {readTime % 60}s</Text>
          <Text style={styles.completion}>Completion: {Math.round(scrollProgress)}%</Text>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <TouchableOpacity
            style={styles.commentsToggle}
            onPress={() => setShowComments(!showComments)}
          >
            <Text style={styles.commentsToggleText}>
              {showComments ? 'Hide Comments' : 'Show Comments'}
            </Text>
          </TouchableOpacity>
          {renderComments()}
        </View>

        {/* Related Articles Placeholder */}
        <View style={styles.relatedSection}>
          <Text style={styles.relatedTitle}>Related Articles</Text>
          <Text style={styles.relatedPlaceholder}>
            More articles from this category would appear here...
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 1,
  },
  category: {
    color: '#007bff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 32,
    marginBottom: 16,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  featuredImageContainer: {
    marginBottom: 0,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#e0e0e0',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007bff',
  },
  contentContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 1,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  footer: {
    backgroundColor: '#ffffff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  readTime: {
    fontSize: 14,
    color: '#666',
  },
  completion: {
    fontSize: 14,
    color: '#666',
  },
  commentsSection: {
    backgroundColor: '#ffffff',
    marginBottom: 1,
  },
  commentsToggle: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  commentsToggleText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
    textAlign: 'center',
  },
  commentsContainer: {
    height: 400,
  },
  commentsWebView: {
    flex: 1,
  },
  commentsLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  commentsLoadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  relatedSection: {
    backgroundColor: '#ffffff',
    padding: 20,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  relatedPlaceholder: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  headerButton: {
    marginRight: 16,
  },
  headerButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '500',
  },
});
