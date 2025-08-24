import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

interface Category {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

interface DualCategoryTabsProps {
  onCategorySelect: (category: Category) => void;
  selectedCategory: Category;
}

type TabType = 'regular' | 'featured' | 'sports';

const { width } = Dimensions.get('window');

// Regular news categories
const REGULAR_CATEGORIES: Category[] = [
  { id: 'all', name: 'All News', slug: '' },
  { id: '3', name: 'Local News', slug: 'local' },
  { id: '17600', name: 'Crime Watch', slug: 'crime' },
  { id: '1713', name: 'Business', slug: 'business' },
  { id: '14228', name: 'Education', slug: 'education' },
  { id: '34701', name: 'Agriculture', slug: 'agriculture' },
  { id: '4', name: 'Arts & Entertainment', slug: 'entertainment-news' },
  { id: '33609', name: 'Food', slug: 'food' },
  { id: '14225', name: 'Faith', slug: 'faith' },
  { id: '25232', name: 'Features', slug: 'features' },
  { id: '30654', name: 'Feel Good', slug: 'feel-good' },
];

// Sports categories
const SPORTS_CATEGORIES: Category[] = [
  { id: 'sports-all', name: 'All Sports', slug: 'sports-all' },
  { id: '34638', name: 'National Sports', slug: 'national-sports' },
  { id: '34690', name: 'Regional Sports', slug: 'regional-sports' },
  { id: '14222', name: 'Outdoors', slug: 'outdoors' },
  { id: '34596', name: 'Football', slug: 'football' },
  { id: '34598', name: 'Basketball', slug: 'basketball' },
  { id: '34594', name: 'Baseball', slug: 'baseball' },
  { id: '34601', name: 'Soccer', slug: 'soccer' },
  { id: '34609', name: 'Hockey', slug: 'hockey' },
  { id: '34615', name: 'Golf', slug: 'golf' },
  { id: '34667', name: 'Athlete of the Week', slug: 'athlete-of-the-week' },
  { id: '34666', name: 'Game of the Week', slug: 'game-of-the-week' },
  { id: '34634', name: 'Game Report', slug: 'game-report' },
  { id: '34617', name: 'Football Scores', slug: 'football-scores' },
  { id: '34607', name: 'Boys Basketball Scores', slug: 'boys-basketball-scores' },
  { id: '34608', name: 'Girls Basketball Scores', slug: 'girls-basketball-scores' },
  { id: '34600', name: 'Baseball Scores', slug: 'baseball-scores' },
  { id: '34602', name: 'Boys Soccer Scores', slug: 'boys-soccer-scores' },
  { id: '34603', name: 'Girls Soccer Scores', slug: 'girls-soccer-scores' },
];

// Featured columns and special content
const FEATURED_COLUMNS: Category[] = [
  { id: 'featured-all', name: 'All Featured Columns', slug: 'featured-all' },
  { id: '33629', name: '7 Questions', slug: '7-questions' },
  { id: '33654', name: 'Ask the Doctor', slug: 'ask-the-doctor' },
  { id: '33557', name: 'Biz Buzz', slug: 'biz-buzz' },
  { id: '34697', name: 'Courtroom Insider', slug: 'courtroom-insider' },
  { id: '25233', name: 'Dave Says', slug: 'dave-says' },
  { id: '33635', name: 'East Idaho Eats', slug: 'east-idaho-eats' },
  { id: '31250', name: 'Feel Good Friday', slug: 'feel-good-friday' },
  { id: '35316', name: 'Legally Speaking', slug: 'legally-speaking' },
  { id: '27012', name: 'Living the Wild Life', slug: 'living-the-wild-life' },
  { id: '33641', name: 'Looking Back', slug: 'looking-back' },
  { id: '33627', name: 'Pet of the Week', slug: 'pet-of-the-week' },
  { id: '33660', name: 'Savvy Senior', slug: 'savvy-senior' },
  { id: '32014', name: 'Secret Santa', slug: 'secret-santa' },
];

export default function DualCategoryTabs({ onCategorySelect, selectedCategory }: DualCategoryTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('regular');

  const handleTabPress = (tab: TabType) => {
    console.log('🔄 Tab pressed:', tab);
    setActiveTab(tab);
    
    if (tab === 'regular') {
      // For regular categories, use the first one
      const firstCategory = REGULAR_CATEGORIES[0];
      console.log('🔄 First category of tab:', firstCategory);
      onCategorySelect(firstCategory);
    } else if (tab === 'featured') {
      // For featured columns, automatically select "All Featured Columns"
      const allFeaturedCategory = FEATURED_COLUMNS[0]; // This is "All Featured Columns"
      console.log('🔄 All featured columns category:', allFeaturedCategory);
      onCategorySelect(allFeaturedCategory);
    } else if (tab === 'sports') {
      // For sports, automatically select "All Sports"
      const allSportsCategory = SPORTS_CATEGORIES[0]; // This is "All Sports"
      console.log('🔄 All sports category:', allSportsCategory);
      onCategorySelect(allSportsCategory);
    }
  };

  const handleCategoryPress = (category: Category) => {
    console.log('🎯 Category pressed:', category.name, category.id);
    onCategorySelect(category);
  };

  const getCurrentCategories = () => {
    let categories: Category[];
    if (activeTab === 'regular') {
      categories = REGULAR_CATEGORIES;
    } else if (activeTab === 'featured') {
      categories = FEATURED_COLUMNS;
    } else if (activeTab === 'sports') {
      categories = SPORTS_CATEGORIES;
    } else {
      categories = REGULAR_CATEGORIES;
    }
    // console.log('📋 Current categories for tab:', activeTab, categories.length, 'categories');
    return categories;
  };

  const isCategorySelected = (category: Category) => {
    const isSelected = selectedCategory.id === category.id;
    // Only log when debugging is needed
    // console.log('🔍 Category selection check:', { category: category.name, categoryId: category.id, selectedId: selectedCategory.id, isSelected });
    return isSelected;
  };

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'regular' && styles.activeTabButton
          ]}
          onPress={() => handleTabPress('regular')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'regular' && styles.activeTabButtonText
          ]}>
            📰 News
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'featured' && styles.activeTabButton
          ]}
          onPress={() => handleTabPress('featured')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'featured' && styles.activeTabButtonText
          ]}>
            ⭐ Featured
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'sports' && styles.activeTabButton
          ]}
          onPress={() => handleTabPress('sports')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'sports' && styles.activeTabButtonText
          ]}>
            🏈 Sports
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <ScrollView
        key={activeTab} // Force re-render when tab changes
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {getCurrentCategories().map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              isCategorySelected(category) && styles.categoryTabActive
            ]}
            onPress={() => handleCategoryPress(category)}
          >
            <Text style={[
              styles.categoryTabText,
              isCategorySelected(category) && styles.categoryTabTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#e42c29',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabButtonText: {
    color: '#ffffff',
  },
  categoryTabs: {
    backgroundColor: '#ffffff',
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
    backgroundColor: '#e42c29',
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
});
