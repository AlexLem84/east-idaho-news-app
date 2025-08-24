const WORDPRESS_API_URL = 'https://eastidahonews.com/wp-json/wp/v2';

export interface WordPressImage {
  id: number;
  source_url: string;
  alt_text: string;
  caption: { rendered: string };
  media_details: {
    sizes: {
      thumbnail?: { source_url: string; width: number; height: number };
      medium?: { source_url: string; width: number; height: number };
      large?: { source_url: string; width: number; height: number };
      full?: { source_url: string; width: number; height: number };
    };
  };
}

export interface WordPressPost {
  id: number;
  date: string;
  title: { rendered: string; };
  content: { rendered: string; };
  excerpt: { rendered: string; };
  slug: string;
  link: string;
  author: number;
  featured_media: number;
  categories: number[];
  meta_fields?: {
    _dc_author?: string[];
  };
  _embedded?: {
    'wp:featuredmedia'?: WordPressImage[];
  };
}

class WordPressService {
  async getPosts(perPage: number = 20, categorySlug: string = '', page: number = 1): Promise<WordPressPost[]> {
    try {
      // Build URL with category filter if provided
      let url = `${WORDPRESS_API_URL}/posts?per_page=${perPage}&page=${page}&_embed`;
      if (categorySlug && categorySlug !== '') {
        console.log('🔍 WordPress Service: Processing categorySlug:', categorySlug);
        
        // Special handling for "featured-all" - get all featured column categories
        if (categorySlug === 'featured-all') {
          const featuredCategoryIds = [
            '33629', // 7 Questions
            '33654', // Ask the Doctor
            '33557', // Biz Buzz
            '34697', // Courtroom Insider
            '25233', // Dave Says
            '33635', // East Idaho Eats
            '31250', // Feel Good Friday
            '35316', // Legally Speaking
            '27012', // Living the Wild Life
            '33641', // Looking Back
            '33627', // Pet of the Week
            '33660', // Savvy Senior
            '32014', // Secret Santa
          ];
          const categoryIdsString = featuredCategoryIds.join(',');
          url += `&categories=${categoryIdsString}`;
          console.log('🔍 WordPress Service: Using all featured categories:', categoryIdsString);
        } else if (categorySlug === 'sports-all') {
          // Special handling for "sports-all" - get all sports categories
          const sportsCategoryIds = [
            '34638', // National Sports
            '34690', // Regional Sports
            '14222', // Outdoors
            '34596', // Football
            '34598', // Basketball
            '34594', // Baseball
            '34601', // Soccer
            '34609', // Hockey
            '34615', // Golf
            '34667', // Athlete of the Week
            '34666', // Game of the Week
            '34634', // Game Report
            '34617', // Football Scores
            '34607', // Boys Basketball Scores
            '34608', // Girls Basketball Scores
            '34600', // Baseball Scores
            '34602', // Boys Soccer Scores
            '34603', // Girls Soccer Scores
          ];
          const categoryIdsString = sportsCategoryIds.join(',');
          url += `&categories=${categoryIdsString}`;
          console.log('🔍 WordPress Service: Using all sports categories:', categoryIdsString);
        } else {
          // Check if categorySlug is already a number (category ID)
          const categoryId = parseInt(categorySlug);
          if (!isNaN(categoryId)) {
            // It's already a category ID
            url += `&categories=${categoryId}`;
            console.log('🔍 WordPress Service: Using category ID directly:', categoryId);
          } else {
            // It's a slug, convert to ID
            const fetchedCategoryId = await this.getCategoryId(categorySlug);
            if (fetchedCategoryId) {
              url += `&categories=${fetchedCategoryId}`;
              console.log('🔍 WordPress Service: Converted slug to ID:', categorySlug, '→', fetchedCategoryId);
            }
          }
        }
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('API Response:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`📰 WordPress Service: Fetched ${data.length} posts${categorySlug ? ` for category: ${categorySlug}` : ''}`);
      console.log('📰 WordPress Service: URL used:', url);
      return data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      // For web debugging, let's return some mock data if the API fails
      if (error instanceof Error && error.message.includes('CORS')) {
        console.log('CORS error detected, returning mock data for web');
        return this.getMockPosts(categorySlug);
      }
      throw error;
    }
  }

  async getCategoryId(slug: string): Promise<number | null> {
    try {
      const response = await fetch(`${WORDPRESS_API_URL}/categories?slug=${slug}`);
      if (!response.ok) return null;
      
      const categories = await response.json();
      return categories.length > 0 ? categories[0].id : null;
    } catch (error) {
      console.error('Error fetching category:', error);
      return null;
    }
  }

  getMockPosts(categorySlug: string = ''): WordPressPost[] {
    const basePosts = [
      {
        id: 1,
        date: new Date().toISOString(),
        title: { rendered: 'East Idaho News App - Real-time Updates' },
        content: { rendered: 'This is a mock article for web testing with real-time updates.' },
        excerpt: { rendered: 'Welcome to the new East Idaho News app with instant updates!' },
        slug: 'welcome',
        link: '#',
        author: 1,
        featured_media: 1,
        categories: [1],
        meta_fields: { _dc_author: ['East Idaho News'] },
        _embedded: {
          'wp:featuredmedia': [{
            id: 1,
            source_url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop',
            alt_text: 'News app interface',
            caption: { rendered: 'Modern news app interface' },
            media_details: {
              sizes: {
                medium: { source_url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop', width: 400, height: 200 },
                large: { source_url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop', width: 800, height: 400 }
              }
            }
          }]
        }
      },
      {
        id: 2,
        date: new Date(Date.now() - 3600000).toISOString(),
        title: { rendered: 'Local Community Updates' },
        content: { rendered: 'Stay informed about your local community with real-time updates.' },
        excerpt: { rendered: 'Get the latest updates from your neighborhood instantly.' },
        slug: 'community-updates',
        link: '#',
        author: 1,
        featured_media: 2,
        categories: [1],
        meta_fields: { _dc_author: ['Community Reporter'] },
        _embedded: {
          'wp:featuredmedia': [{
            id: 2,
            source_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop',
            alt_text: 'Community meeting',
            caption: { rendered: 'Local community gathering' },
            media_details: {
              sizes: {
                medium: { source_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=200&fit=crop', width: 400, height: 200 },
                large: { source_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop', width: 800, height: 400 }
              }
            }
          }]
        }
      },
      {
        id: 3,
        date: new Date(Date.now() - 7200000).toISOString(),
        title: { rendered: 'Breaking News Alert' },
        content: { rendered: 'Important breaking news for the East Idaho community.' },
        excerpt: { rendered: 'Stay updated with the latest breaking news as it happens.' },
        slug: 'breaking-news',
        link: '#',
        author: 1,
        featured_media: 3,
        categories: [1],
        meta_fields: { _dc_author: ['Breaking News Team'] },
        _embedded: {
          'wp:featuredmedia': [{
            id: 3,
            source_url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop',
            alt_text: 'Breaking news',
            caption: { rendered: 'Breaking news alert' },
            media_details: {
              sizes: {
                medium: { source_url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop', width: 400, height: 200 },
                large: { source_url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop', width: 800, height: 400 }
              }
            }
          }]
        }
      }
    ];

    // Filter by category if specified
    if (categorySlug) {
      return basePosts.filter(post => {
        const title = post.title.rendered.toLowerCase();
        switch (categorySlug) {
          case 'entertainment-news':
            return title.includes('entertainment') || title.includes('arts') || title.includes('movie');
          case 'business':
            return title.includes('business') || title.includes('money') || title.includes('economy');
          case 'local':
            return title.includes('local') || title.includes('community') || title.includes('idaho');
          case 'sports':
            return title.includes('sports') || title.includes('game') || title.includes('athlete');
          case 'agriculture':
            return title.includes('agriculture') || title.includes('farm') || title.includes('crop');
          case 'ask-the-doctor':
            return title.includes('doctor') || title.includes('health') || title.includes('medical');
          case '7-questions':
            return title.includes('question') || title.includes('interview');
          case 'aliens':
            return title.includes('alien') || title.includes('ufo') || title.includes('extraterrestrial');
          case 'ammon':
            return title.includes('ammon') || title.includes('local');
          case 'blackfoot':
            return title.includes('blackfoot') || title.includes('local');
          case 'ashton':
            return title.includes('ashton') || title.includes('local');
          default:
            return true;
        }
      });
    }

    return basePosts;
  }

  stripHtml(html: string): string {
    // Enhanced HTML stripping with better error handling
    try {
      return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    } catch (error) {
      console.error('Error stripping HTML:', error);
      return html;
    }
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  }

  // Analytics tracking method
  trackArticleView(articleId: number, articleTitle: string): void {
    console.log('Article View Tracked:', {
      id: articleId,
      title: articleTitle,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    });
    
    // TODO: Send to analytics service
    // This could be Firebase Analytics, Google Analytics, or a custom endpoint
  }
}

export const wordpressService = new WordPressService();
export default wordpressService;
