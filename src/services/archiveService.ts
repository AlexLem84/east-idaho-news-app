import wordpressService, { WordPressPost } from './wordpressService';

export interface ArchiveOptions {
  category?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  author?: string;
  perPage?: number;
}

class ArchiveService {
  private cachedStories: Map<string, WordPressPost[]> = new Map();
  private totalStories: number = 0;
  private isLoading: boolean = false;

  // Get total count of stories
  async getTotalStoriesCount(category?: string): Promise<number> {
    try {
      const categorySlug = category || '';
      const response = await fetch(
        `https://eastidahonews.com/wp-json/wp/v2/posts?per_page=1${categorySlug ? `&categories=${categorySlug}` : ''}`
      );
      
      if (response.ok) {
        const totalCount = response.headers.get('X-WP-Total');
        return totalCount ? parseInt(totalCount) : 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting total count:', error);
      return 0;
    }
  }

  // Get stories with smart caching
  async getStories(options: ArchiveOptions = {}): Promise<{
    stories: WordPressPost[];
    total: number;
    hasMore: boolean;
  }> {
    const {
      category = '',
      search = '',
      dateFrom = '',
      dateTo = '',
      author = '',
      perPage = 10
    } = options;

    const cacheKey = `${category}-${search}-${dateFrom}-${dateTo}-${author}-${perPage}`;
    
    // Check cache first
    if (this.cachedStories.has(cacheKey)) {
      const cached = this.cachedStories.get(cacheKey)!;
      return {
        stories: cached,
        total: this.totalStories,
        hasMore: cached.length < this.totalStories
      };
    }

    try {
      this.isLoading = true;
      
      // Build query parameters
      const params = new URLSearchParams({
        per_page: perPage.toString(),
        _embed: 'true'
      });

      if (category) {
        params.append('categories', category);
      }
      if (search) {
        params.append('search', search);
      }
      if (dateFrom) {
        params.append('after', dateFrom);
      }
      if (dateTo) {
        params.append('before', dateTo);
      }
      if (author) {
        params.append('author', author);
      }

      const response = await fetch(
        `https://eastidahonews.com/wp-json/wp/v2/posts?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const stories = await response.json();
      const total = response.headers.get('X-WP-Total');
      this.totalStories = total ? parseInt(total) : stories.length;

      // Cache the results
      this.cachedStories.set(cacheKey, stories);

      return {
        stories,
        total: this.totalStories,
        hasMore: stories.length < this.totalStories
      };

    } catch (error) {
      console.error('Error fetching stories:', error);
      return {
        stories: [],
        total: 0,
        hasMore: false
      };
    } finally {
      this.isLoading = false;
    }
  }

  // Get stories by date range
  async getStoriesByDateRange(from: string, to: string, category?: string): Promise<WordPressPost[]> {
    const result = await this.getStories({
      dateFrom: from,
      dateTo: to,
      category,
      perPage: 100
    });
    return result.stories;
  }

  // Get stories by author
  async getStoriesByAuthor(authorId: string, category?: string): Promise<WordPressPost[]> {
    const result = await this.getStories({
      author: authorId,
      category,
      perPage: 100
    });
    return result.stories;
  }

  // Search stories
  async searchStories(query: string, category?: string): Promise<WordPressPost[]> {
    const result = await this.getStories({
      search: query,
      category,
      perPage: 100
    });
    return result.stories;
  }

  // Get popular stories (most viewed - would need custom endpoint)
  async getPopularStories(category?: string, days: number = 30): Promise<WordPressPost[]> {
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const result = await this.getStories({
      dateFrom,
      category,
      perPage: 50
    });
    return result.stories;
  }

  // Clear cache
  clearCache(): void {
    this.cachedStories.clear();
    this.totalStories = 0;
  }

  // Get cache stats
  getCacheStats(): { cachedQueries: number; totalStories: number } {
    return {
      cachedQueries: this.cachedStories.size,
      totalStories: this.totalStories
    };
  }

  // Check if loading
  get isLoading(): boolean {
    return this.isLoading;
  }
}

export const archiveService = new ArchiveService();
export default archiveService;
