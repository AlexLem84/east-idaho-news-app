import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import analyticsService from '../services/analyticsService';

interface AnalyticsDashboardProps {
  visible: boolean;
  onClose: () => void;
}

export default function AnalyticsDashboard({ visible, onClose }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      updateAnalytics();
      const interval = setInterval(updateAnalytics, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [visible]);

  const updateAnalytics = () => {
    const sessionAnalytics = analyticsService.getSessionAnalytics();
    const topArticles = analyticsService.getTopArticles(5);
    const categoryAnalytics = analyticsService.getCategoryAnalytics();
    
    setAnalytics({
      session: sessionAnalytics,
      topArticles,
      categories: categoryAnalytics
    });
  };

  if (!visible || !analytics) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics Dashboard</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Session Analytics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{analytics.session.totalArticlesViewed}</Text>
                <Text style={styles.statLabel}>Articles Viewed</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {Math.floor(analytics.session.sessionDuration / 1000 / 60)}m
                </Text>
                <Text style={styles.statLabel}>Session Time</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {Math.round(analytics.session.averageReadTime)}s
                </Text>
                <Text style={styles.statLabel}>Avg Read Time</Text>
              </View>
            </View>
          </View>

          {/* Top Articles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Articles</Text>
            {analytics.topArticles.map((article: any, index: number) => (
              <View key={article.id} style={styles.articleCard}>
                <Text style={styles.articleRank}>#{index + 1}</Text>
                <View style={styles.articleInfo}>
                  <Text style={styles.articleTitle} numberOfLines={2}>
                    {article.title}
                  </Text>
                  <Text style={styles.articleMeta}>
                    {article.views} views • {article.category}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Category Analytics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Performance</Text>
            {analytics.categories.map((category: any) => (
              <View key={category.category} style={styles.categoryCard}>
                <Text style={styles.categoryName}>{category.category}</Text>
                <View style={styles.categoryStats}>
                  <Text style={styles.categoryStat}>
                    {category.totalViews} views
                  </Text>
                  <Text style={styles.categoryStat}>
                    {category.uniqueArticles} articles
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Export Button */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => {
                const data = analyticsService.exportAnalytics();
                console.log('📊 Analytics Data:', data);
                alert('Analytics data exported to console!');
              }}
            >
              <Text style={styles.exportButtonText}>Export Analytics Data</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007bff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  articleRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginRight: 12,
    minWidth: 30,
  },
  articleInfo: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  articleMeta: {
    fontSize: 12,
    color: '#666',
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  categoryStats: {
    alignItems: 'flex-end',
  },
  categoryStat: {
    fontSize: 12,
    color: '#666',
  },
  exportButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
