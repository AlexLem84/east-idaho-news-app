import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Platform, Dimensions, Image } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import wordpressService, { WordPressPost } from '../services/wordpressService';
import analyticsService from '../services/analyticsService';
import realtimeService, { RealtimeUpdate } from '../services/realtimeService';
import { RootStackParamList } from '../types/navigation';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import StoryImage from '../components/StoryImage';
import DualCategoryTabs from '../components/DualCategoryTabs';

type HomeScreenProps = StackScreenProps<RootStackParamList, 'Home'>;

// Category interface for the dual tabs system
interface Category {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

const DEFAULT_CATEGORY: Category = { id: 'all', name: 'All News', slug: '' };

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>(DEFAULT_CATEGORY);
  const [articleViews, setArticleViews] = useState<{[key: number]: number}>({});
  const [realtimeStatus, setRealtimeStatus] = useState<string>('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPosts = async (category: Category = DEFAULT_CATEGORY, pageNum = 1, append = false) => {
    try {
      setError(null);
      const fetchedPosts = await wordpressService.getPosts(10, category.id, pageNum); // Reduced from 20 to 10
      
      if (append) {
        setPosts(prev => [...prev, ...fetchedPosts]);
      } else {
        setPosts(fetchedPosts);
      }
      
      // Check if we have more posts
      setHasMorePosts(fetchedPosts.length === 10); // Updated to match new limit
    } catch (err) {
      setError('Failed to load news. Please try again.');
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initialize the app (only run once)
  useEffect(() => { 
    loadPosts(DEFAULT_CATEGORY, 1, false); 
    
    // Track session start
    analyticsService.trackSessionStart();
    
    // Start real-time updates
    realtimeService.startPolling();
    
    // Subscribe to real-time updates
    const unsubscribe = realtimeService.subscribe((update: RealtimeUpdate) => {
      console.log('🆕 Real-time update received:', update);
      setRealtimeStatus(`${update.type}: ${update.article.title.rendered}`);
      
      // Refresh articles if it's a new article
      if (update.type === 'new_article' || update.type === 'breaking_news') {
        loadPosts(selectedCategory, 1, false);
      }
    });
    
    return () => {
      unsubscribe();
      realtimeService.stopPolling();
    };
  }, []); // Remove selectedCategory dependency - only run once

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadPosts(selectedCategory);
    setRefreshing(false);
  }, [selectedCategory]);

  const handleCategorySelect = async (category: Category) => {
    console.log('🏠 HomeScreen: Category selected:', category);
    console.warn('🏠 HomeScreen: Category selected:', category); // This shows in terminal
    setSelectedCategory(category);
    setLoading(true);
    setPage(1);
    
    // Track category view
    analyticsService.trackCategoryView(category.id);
    
    await loadPosts(category, 1, false);
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMorePosts) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    
    await loadPosts(selectedCategory, nextPage, true);
  };

  const handleArticlePress = (post: WordPressPost) => {
    // Track article view for analytics
    setArticleViews(prev => ({
      ...prev,
      [post.id]: (prev[post.id] || 0) + 1
    }));
    
    // Track with analytics service
    analyticsService.trackArticleView(post, selectedCategory.id);
    
    // Navigate to article detail screen
    navigation.navigate('ArticleDetail', {
      article: post,
      category: selectedCategory.id
    });
  };

  const renderPost = (post: WordPressPost, index: number) => {
    const excerpt = wordpressService.stripHtml(post.excerpt.rendered);
    const timeAgo = wordpressService.formatDate(post.date);
    const featuredImage = post._embedded?.['wp:featuredmedia']?.[0];
    
    return (
      <TouchableOpacity 
        key={post.id} 
        style={styles.articleCard}
        onPress={() => handleArticlePress(post)}
      >
        <View style={styles.articleContent}>
          <View style={styles.articleHeader}>
            <Text style={styles.articleNumber}>#{index + 1}</Text>
            <Text style={styles.category}>Latest News</Text>
          </View>
          
          {/* Featured Image */}
          {featuredImage && (
            <View style={styles.imageContainer}>
              <StoryImage
                image={featuredImage}
                height={150}
                borderRadius={8}
                fallbackText="Story Image"
              />
            </View>
          )}
          
          <Text style={styles.title}>{post.title.rendered}</Text>
          <Text style={styles.excerpt} numberOfLines={2}>{excerpt}</Text>
          <View style={styles.articleMeta}>
            <Text style={styles.publishedAt}>{timeAgo}</Text>
            <Text style={styles.author}>{post.meta_fields?._dc_author?.[0] || 'East Idaho News'}</Text>
            <Text style={styles.viewCount}>{articleViews[post.id] || 0} views</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Image 
              source={{ uri: 'https://www.eastidahonews.com/wp-content/themes/nate/bin/img/eastidahonews-logo-horizontal.svg' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.headerSubtitle}>Top 20 Stories</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('Archive')}
            >
              <Text style={styles.headerButtonText}>📚</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowAnalytics(true)}
            >
              <Text style={styles.headerButtonText}>📊</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading latest news...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>East Idaho News</Text>
        <Text style={styles.headerSubtitle}>Top 20 Stories</Text>
      </View>
      
                {/* Dual Category Tabs */}
          <DualCategoryTabs
            onCategorySelect={handleCategorySelect}
            selectedCategory={selectedCategory}
          />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={true}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadPosts(selectedCategory)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.breakingNews}>
          <Text style={styles.breakingNewsText}>
            🔥 BREAKING: Real-time updates from East Idaho News
            {realtimeStatus && ` • ${realtimeStatus}`}
          </Text>
        </View>

        <View style={styles.articlesContainer}>
          {posts.map((post, index) => renderPost(post, index))}
          
          {/* Load More Button */}
          {hasMorePosts && posts.length > 0 && (
            <TouchableOpacity 
              style={styles.loadMoreButton}
              onPress={loadMorePosts}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.loadMoreText}>Load More Stories</Text>
              )}
            </TouchableOpacity>
          )}
          
          {/* Add some test content to ensure scrolling works */}
          {posts.length === 0 && !error && (
            <View style={styles.testContent}>
              <Text style={styles.testTitle}>Test Content for Scrolling</Text>
              {Array.from({ length: 10 }, (_, i) => (
                <View key={i} style={styles.testItem}>
                  <Text style={styles.testText}>Test Article {i + 1}</Text>
                  <Text style={styles.testSubtext}>This is test content to ensure scrolling works properly.</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {posts.length === 0 && !error && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No articles found in this category</Text>
          </View>
        )}

        {/* Submit Tips Section */}
        <View style={styles.submitTipsContainer}>
          <Text style={styles.submitTipsTitle}>Have a News Tip?</Text>
          <TouchableOpacity style={styles.submitTipsButton}>
            <Text style={styles.submitTipsButtonText}>Submit Your Tip</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard 
        visible={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5',
    ...(Platform.OS === 'web' && {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    })
  },
  header: { 
    backgroundColor: '#e42c29', 
    padding: 20, 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 20 : 50,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    height: 40,
    width: 200,
    marginBottom: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  headerButtonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  headerSubtitle: { fontSize: 14, color: '#ffffff', opacity: 0.8, marginTop: 4 },

  scrollView: { flex: 1 },
  scrollViewContent: { 
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 16, color: '#666', marginTop: 16 },
  errorContainer: { backgroundColor: '#ffebee', margin: 16, padding: 16, borderRadius: 8, alignItems: 'center' },
  errorText: { color: '#c62828', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  retryButton: { backgroundColor: '#e42c29', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 6 },
  retryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  breakingNews: { backgroundColor: '#ff6b6b', padding: 12, margin: 16, borderRadius: 8 },
  breakingNewsText: { color: '#ffffff', fontWeight: 'bold', textAlign: 'center' },
  articlesContainer: { padding: 16 },
  articleCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    marginBottom: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3,
  },
  articleContent: { padding: 16 },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  articleNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e42c29',
  },
  category: { color: '#e42c29', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8, lineHeight: 24 },
  excerpt: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 12 },
  imageContainer: {
    marginBottom: 12,
  },
  articleMeta: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  publishedAt: { fontSize: 12, color: '#999' },
  author: { fontSize: 12, color: '#e42c29', fontWeight: '500' },
  viewCount: { fontSize: 12, color: '#999' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center' },
  submitTipsContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitTipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  submitTipsButton: {
    backgroundColor: '#e42c29',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitTipsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  testContent: {
    padding: 16,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  testItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  testText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  testSubtext: {
    fontSize: 14,
    color: '#666',
  },
  loadMoreButton: {
    backgroundColor: '#e42c29',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  loadMoreText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
