// Mock Analytics Service for when Firebase isn't available
class MockAnalyticsService {
  private events: Array<{event: string, params?: any, timestamp: Date}> = [];

  async logEvent(eventName: string, parameters?: any) {
    const event = {
      event: eventName,
      params: parameters,
      timestamp: new Date()
    };
    this.events.push(event);
    console.log('📊 Mock Analytics Event:', eventName, parameters);
  }

  async setUserId(userId: string) {
    console.log('📊 Mock Analytics: Set User ID:', userId);
  }

  async setUserProperties(properties: any) {
    console.log('📊 Mock Analytics: Set User Properties:', properties);
  }

  async trackArticleView(article: any, category: string) {
    await this.logEvent('article_view', {
      article_id: article.id,
      article_title: article.title?.rendered,
      category: category,
      timestamp: new Date().toISOString()
    });
  }

  async trackArticleReadTime(articleId: number, readTime: number) {
    await this.logEvent('article_read_time', {
      article_id: articleId,
      read_time_seconds: readTime,
      timestamp: new Date().toISOString()
    });
  }

  async trackCategoryView(category: string) {
    await this.logEvent('category_view', {
      category: category,
      timestamp: new Date().toISOString()
    });
  }

  async trackSessionStart() {
    await this.logEvent('session_start', {
      timestamp: new Date().toISOString()
    });
  }

  getEvents() {
    return this.events;
  }

  clearEvents() {
    this.events = [];
  }
}

export const mockAnalyticsService = new MockAnalyticsService();
export default mockAnalyticsService;
