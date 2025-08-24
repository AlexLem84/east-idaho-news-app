import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import archiveService, { ArchiveOptions } from '../services/archiveService';
import wordpressService, { WordPressPost } from '../services/wordpressService';
import analyticsService from '../services/analyticsService';
import StoryImage from '../components/StoryImage';

type ArchiveScreenProps = StackScreenProps<RootStackParamList, 'Archive'>;

export default function ArchiveScreen({ navigation }: ArchiveScreenProps) {
  const [stories, setStories] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [totalStories, setTotalStories] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const CATEGORIES = [
    { id: '', name: 'All Categories' },
    { id: 'entertainment-news', name: 'Arts & Entertainment' },
    { id: 'business', name: 'Business & Money' },
    { id: 'local', name: 'Local News' },
    { id: 'sports', name: 'Sports' },
    { id: 'agriculture', name: 'Agriculture' },
    { id: 'education', name: 'Education' },
    { id: 'crime', name: 'Crime Watch' },
    { id: 'food', name: 'Food' },
    { id: 'faith', name: 'Faith' },
    { id: 'features', name: 'Features' },
    { id: 'feel-good', name: 'Feel Good' },
    // Featured Columns
    { id: '33629', name: '7 Questions' },
    { id: '33654', name: 'Ask the Doctor' },
    { id: '33557', name: 'Biz Buzz' },
    { id: '34697', name: 'Courtroom Insider' },
    { id: '25233', name: 'Dave Says' },
    { id: '33635', name: 'East Idaho Eats' },
    { id: '31250', name: 'Feel Good Friday' },
    { id: '35316', name: 'Legally Speaking' },
    { id: '27012', name: 'Living the Wild Life' },
    { id: '33641', name: 'Looking Back' },
    { id: '33627', name: 'Pet of the Week' },
    { id: '33660', name: 'Savvy Senior' },
    { id: '32014', name: 'Secret Santa' },
  ];

  useEffect(() => {
    loadStories();
  }, [selectedCategory, searchQuery]);

  const loadStories = async (append = false) => {
    try {
      setLoading(!append);
      setLoadingMore(append);

      const options: ArchiveOptions = {
        category: selectedCategory,
        search: searchQuery,
        perPage: 10 // Reduced from 50 to 10 for better performance
      };

      const result = await archiveService.getStories(options);
      
      if (append) {
        setStories(prev => [...prev, ...result.stories]);
      } else {
        setStories(result.stories);
        setPage(1);
      }
      
      setTotalStories(result.total);
      setHasMore(result.hasMore);

      // Track archive usage
      analyticsService.trackCategoryView(`archive-${selectedCategory || 'all'}`);

    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreStories = async () => {
    if (loadingMore || !hasMore) return;
    
    setPage(prev => prev + 1);
    await loadStories(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleStoryPress = (story: WordPressPost) => {
    analyticsService.trackArticleView(story, selectedCategory || 'archive');
    navigation.navigate('ArticleDetail', {
      article: story,
      category: selectedCategory || 'archive'
    });
  };

  const renderStory = (story: WordPressPost, index: number) => {
    const excerpt = wordpressService.stripHtml(story.excerpt.rendered);
    const timeAgo = wordpressService.formatDate(story.date);
    const featuredImage = story._embedded?.['wp:featuredmedia']?.[0];
    
    return (
      <TouchableOpacity 
        key={story.id} 
        style={styles.storyCard}
        onPress={() => handleStoryPress(story)}
      >
        <View style={styles.storyContent}>
          {/* Featured Image */}
          {featuredImage && (
            <View style={styles.imageContainer}>
              <StoryImage
                image={featuredImage}
                height={120}
                borderRadius={8}
                fallbackText="Story Image"
              />
            </View>
          )}
          
          <Text style={styles.storyTitle}>{story.title.rendered}</Text>
          <Text style={styles.storyExcerpt} numberOfLines={2}>{excerpt}</Text>
          <View style={styles.storyMeta}>
            <Text style={styles.storyDate}>{timeAgo}</Text>
            <Text style={styles.storyAuthor}>
              {story.meta_fields?._dc_author?.[0] || 'East Idaho News'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Archive</Text>
        <Text style={styles.headerSubtitle}>
          {totalStories.toLocaleString()} stories available
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search all stories..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              selectedCategory === category.id && styles.categoryTabActive
            ]}
            onPress={() => handleCategoryPress(category.id)}
          >
            <Text style={[
              styles.categoryTabText,
              selectedCategory === category.id && styles.categoryTabTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stories List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Loading stories...</Text>
          </View>
        ) : (
          <>
            <View style={styles.storiesContainer}>
              {stories.map((story, index) => renderStory(story, index))}
            </View>

            {/* Load More Button */}
            {hasMore && stories.length > 0 && (
              <TouchableOpacity 
                style={styles.loadMoreButton}
                onPress={loadMoreStories}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.loadMoreText}>
                    Load More Stories ({stories.length} of {totalStories.toLocaleString()})
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {stories.length === 0 && !loading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No stories found for your search.' : 'No stories available in this category.'}
                </Text>
              </View>
            )}
          </>
        )}
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
  header: {
    backgroundColor: '#007bff',
    padding: 20,
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 20 : 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
  },
  categoryTabs: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    maxHeight: 60,
  },
  categoryTabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    minWidth: 100,
  },
  categoryTabActive: {
    backgroundColor: '#007bff',
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  categoryTabTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  storiesContainer: {
    padding: 16,
  },
  storyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storyContent: {
    padding: 16,
  },
  imageContainer: {
    marginBottom: 12,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  storyExcerpt: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  storyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyDate: {
    fontSize: 12,
    color: '#999',
  },
  storyAuthor: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
  loadMoreButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  loadMoreText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
