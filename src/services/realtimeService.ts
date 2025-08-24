import wordpressService, { WordPressPost } from './wordpressService';

export interface RealtimeUpdate {
  type: 'new_article' | 'updated_article' | 'breaking_news';
  article: WordPressPost;
  timestamp: string;
}

class RealtimeService {
  private lastUpdateTime: string = new Date().toISOString();
  private pollingInterval: number = 30000; // 30 seconds (much faster than 10-15 minutes)
  private isPolling: boolean = false;
  private subscribers: ((update: RealtimeUpdate) => void)[] = [];
  private lastArticleIds: Set<number> = new Set();

  startPolling(): void {
    if (this.isPolling) return;
    
    this.isPolling = true;
    console.log('🔄 Starting real-time updates (polling every 30 seconds)');
    
    this.pollForUpdates();
  }

  stopPolling(): void {
    this.isPolling = false;
    console.log('⏹️ Stopped real-time updates');
  }

  setPollingInterval(seconds: number): void {
    this.pollingInterval = seconds * 1000;
    console.log(`⏱️ Polling interval set to ${seconds} seconds`);
  }

  private async pollForUpdates(): Promise<void> {
    if (!this.isPolling) return;

    try {
      const articles = await wordpressService.getPosts(10);
      const newArticles = this.detectNewArticles(articles);
      
      if (newArticles.length > 0) {
        console.log(`🆕 Found ${newArticles.length} new articles`);
        newArticles.forEach(article => {
          const update: RealtimeUpdate = {
            type: this.determineUpdateType(article),
            article,
            timestamp: new Date().toISOString()
          };
          
          this.notifySubscribers(update);
        });
      }

      // Update last update time
      this.lastUpdateTime = new Date().toISOString();
      
    } catch (error) {
      console.error('Error polling for updates:', error);
    }

    // Schedule next poll
    setTimeout(() => this.pollForUpdates(), this.pollingInterval);
  }

  private detectNewArticles(articles: WordPressPost[]): WordPressPost[] {
    const newArticles: WordPressPost[] = [];
    
    articles.forEach(article => {
      if (!this.lastArticleIds.has(article.id)) {
        newArticles.push(article);
        this.lastArticleIds.add(article.id);
      }
    });

    // Keep only the last 100 article IDs to prevent memory leaks
    if (this.lastArticleIds.size > 100) {
      const idsArray = Array.from(this.lastArticleIds);
      this.lastArticleIds = new Set(idsArray.slice(-50));
    }

    return newArticles;
  }

  private determineUpdateType(article: WordPressPost): 'new_article' | 'updated_article' | 'breaking_news' {
    const title = article.title.rendered.toLowerCase();
    const content = article.content.rendered.toLowerCase();
    
    // Check for breaking news indicators
    if (title.includes('breaking') || title.includes('urgent') || 
        content.includes('breaking') || content.includes('urgent')) {
      return 'breaking_news';
    }
    
    // Check if it's a recent article (within last hour)
    const articleDate = new Date(article.date);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    if (articleDate > oneHourAgo) {
      return 'new_article';
    }
    
    return 'updated_article';
  }

  subscribe(callback: (update: RealtimeUpdate) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(update: RealtimeUpdate): void {
    this.subscribers.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  // Manual trigger for immediate update check
  async checkForUpdates(): Promise<RealtimeUpdate[]> {
    try {
      const articles = await wordpressService.getPosts(20);
      const newArticles = this.detectNewArticles(articles);
      
      return newArticles.map(article => ({
        type: this.determineUpdateType(article),
        article,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error checking for updates:', error);
      return [];
    }
  }

  // Get current status
  getStatus(): {
    isPolling: boolean;
    pollingInterval: number;
    lastUpdateTime: string;
    subscriberCount: number;
  } {
    return {
      isPolling: this.isPolling,
      pollingInterval: this.pollingInterval,
      lastUpdateTime: this.lastUpdateTime,
      subscriberCount: this.subscribers.length
    };
  }

  // Reset service (useful for testing)
  reset(): void {
    this.stopPolling();
    this.lastArticleIds.clear();
    this.subscribers = [];
    this.lastUpdateTime = new Date().toISOString();
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;
