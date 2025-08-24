import { analytics, logEvent, setUserId, setUserProperties } from '../config/firebase';
import { Platform } from 'react-native';
import mockAnalyticsService from './mockAnalyticsService';

export interface ArticleAnalytics {
  id: number;
  title: string;
  views: number;
  category: string;
  author: string;
  timestamp: string;
  readTime?: number;
  completionRate?: number;
}

export interface CategoryAnalytics {
  category: string;
  totalViews: number;
  uniqueArticles: number;
  averageReadTime: number;
}

class AnalyticsService {
  private articleViews: Map<number, ArticleAnalytics> = new Map();
  private sessionStartTime: number = Date.now();

  trackArticleView(article: {
    id: number;
    title: { rendered: string };
    categories: number[];
    meta_fields?: { _dc_author?: string[] };
  }, category: string = 'all'): void {
    const existing = this.articleViews.get(article.id);
    const author = article.meta_fields?._dc_author?.[0] || 'East Idaho News';
    
    if (existing) {
      existing.views += 1;
      existing.timestamp = new Date().toISOString();
    } else {
      this.articleViews.set(article.id, {
        id: article.id,
        title: article.title.rendered,
        views: 1,
        category,
        author,
        timestamp: new Date().toISOString(),
      });
    }

    // Log for debugging
    console.log('📊 Article View Tracked:', {
      id: article.id,
      title: article.title.rendered,
      category,
      author,
      totalViews: this.articleViews.get(article.id)?.views || 1,
      sessionDuration: Date.now() - this.sessionStartTime
    });

    // Send to Firebase Analytics
    this.sendToFirebaseAnalytics(article.id, article.title.rendered, category, author);
  }

  trackArticleReadTime(articleId: number, readTimeSeconds: number, completionRate: number): void {
    const article = this.articleViews.get(articleId);
    if (article) {
      article.readTime = readTimeSeconds;
      article.completionRate = completionRate;
      
      console.log('📖 Read Time Tracked:', {
        id: articleId,
        title: article.title,
        readTime: readTimeSeconds,
        completionRate: completionRate
      });

      // Send read time to Firebase Analytics
      this.sendReadTimeToFirebase(articleId, article.title, readTimeSeconds, completionRate);
    }
  }

  getTopArticles(limit: number = 10): ArticleAnalytics[] {
    return Array.from(this.articleViews.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  getCategoryAnalytics(): CategoryAnalytics[] {
    const categoryMap = new Map<string, CategoryAnalytics>();
    
    this.articleViews.forEach(article => {
      const existing = categoryMap.get(article.category);
      if (existing) {
        existing.totalViews += article.views;
        existing.averageReadTime = (existing.averageReadTime + (article.readTime || 0)) / 2;
      } else {
        categoryMap.set(article.category, {
          category: article.category,
          totalViews: article.views,
          uniqueArticles: 1,
          averageReadTime: article.readTime || 0
        });
      }
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => b.totalViews - a.totalViews);
  }

  getSessionAnalytics(): {
    totalArticlesViewed: number;
    sessionDuration: number;
    averageReadTime: number;
    mostPopularCategory: string;
  } {
    const totalArticles = this.articleViews.size;
    const sessionDuration = Date.now() - this.sessionStartTime;
    const totalReadTime = Array.from(this.articleViews.values())
      .reduce((sum, article) => sum + (article.readTime || 0), 0);
    const averageReadTime = totalArticles > 0 ? totalReadTime / totalArticles : 0;
    
    const categoryAnalytics = this.getCategoryAnalytics();
    const mostPopularCategory = categoryAnalytics[0]?.category || 'all';

    return {
      totalArticlesViewed: totalArticles,
      sessionDuration,
      averageReadTime,
      mostPopularCategory
    };
  }

  private sendToFirebaseAnalytics(
    articleId: number, 
    title: string, 
    category: string, 
    author: string
  ): void {
    if (!analytics) {
      console.log('⚠️ Firebase Analytics not available');
      return;
    }

    try {
      // Log article view event
      logEvent(analytics, 'article_view', {
        article_id: articleId,
        article_title: title,
        category: category,
        author: author,
        platform: Platform.OS,
        timestamp: new Date().toISOString()
      });

      // Log custom event for detailed tracking
      logEvent(analytics, 'news_article_engagement', {
        article_id: articleId,
        category: category,
        author: author,
        engagement_type: 'view'
      });

      console.log('📈 Firebase Analytics: Article view tracked');
    } catch (error) {
      console.error('Failed to send to Firebase Analytics:', error);
      // Fallback to mock analytics
      mockAnalyticsService.logEvent('article_view', {
        article_id: articleId,
        article_title: title,
        category: category,
        author: author,
        platform: Platform.OS,
        timestamp: new Date().toISOString()
      });
    }
  }

  private sendReadTimeToFirebase(
    articleId: number,
    title: string,
    readTimeSeconds: number,
    completionRate: number
  ): void {
    if (!analytics) {
      console.log('⚠️ Firebase Analytics not available');
      return;
    }

    try {
      // Log read time event
      logEvent(analytics, 'article_read_time', {
        article_id: articleId,
        article_title: title,
        read_time_seconds: readTimeSeconds,
        completion_rate: completionRate,
        platform: Platform.OS
      });

      // Log engagement event
      logEvent(analytics, 'news_article_engagement', {
        article_id: articleId,
        engagement_type: 'read_completion',
        read_time_seconds: readTimeSeconds,
        completion_rate: completionRate
      });

      console.log('📈 Firebase Analytics: Read time tracked');
    } catch (error) {
      console.error('Failed to send read time to Firebase Analytics:', error);
      // Fallback to mock analytics
      mockAnalyticsService.logEvent('article_read_time', {
        article_id: articleId,
        article_title: title,
        read_time_seconds: readTimeSeconds,
        completion_rate: completionRate,
        platform: Platform.OS
      });
    }
  }

  // Export analytics data for reporting
  exportAnalytics(): string {
    const sessionAnalytics = this.getSessionAnalytics();
    const topArticles = this.getTopArticles();
    const categoryAnalytics = this.getCategoryAnalytics();

    return JSON.stringify({
      session: sessionAnalytics,
      topArticles,
      categories: categoryAnalytics,
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  // Track category view
  trackCategoryView(category: string): void {
    if (!analytics) {
      // Fallback to mock analytics
      mockAnalyticsService.trackCategoryView(category);
      return;
    }

    try {
      logEvent(analytics, 'category_view', {
        category: category,
        platform: Platform.OS,
        timestamp: new Date().toISOString()
      });

      console.log('📈 Firebase Analytics: Category view tracked');
    } catch (error) {
      console.error('Failed to track category view:', error);
      // Fallback to mock analytics
      mockAnalyticsService.trackCategoryView(category);
    }
  }

  // Track user session
  trackSessionStart(): void {
    if (!analytics) {
      // Fallback to mock analytics
      mockAnalyticsService.trackSessionStart();
      return;
    }

    try {
      logEvent(analytics, 'session_start', {
        platform: Platform.OS,
        timestamp: new Date().toISOString()
      });

      // Set user properties
      setUserProperties(analytics, {
        platform: Platform.OS,
        app_version: '1.0.0',
        news_source: 'east_idaho_news'
      });

      console.log('📈 Firebase Analytics: Session started');
    } catch (error) {
      console.error('Failed to track session start:', error);
      // Fallback to mock analytics
      mockAnalyticsService.trackSessionStart();
    }
  }

  // Reset analytics (useful for testing)
  resetAnalytics(): void {
    this.articleViews.clear();
    this.sessionStartTime = Date.now();
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
