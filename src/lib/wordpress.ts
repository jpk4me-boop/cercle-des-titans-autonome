// WordPress Headless CMS Integration
// REST API client for fetching content from WordPress

export interface WPPost {
  id: number;
  date: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  slug: string;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text: string;
    }>;
    'wp:term'?: Array<Array<{
      id: number;
      name: string;
      slug: string;
    }>>;
    author?: Array<{
      id: number;
      name: string;
      url: string;
      description: string;
      avatar_urls?: Record<string, string>;
    }>;
  };
}

export interface WPPage {
  id: number;
  date: string;
  title: { rendered: string };
  content: { rendered: string };
  slug: string;
  template: string;
}

export interface WPTestimonial {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  acf?: {
    author_name?: string;
    author_role?: string;
    author_avatar?: string;
    rating?: number;
  };
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

export interface WPMedia {
  id: number;
  source_url: string;
  alt_text: string;
  media_details: {
    width: number;
    height: number;
    sizes?: {
      thumbnail?: { source_url: string };
      medium?: { source_url: string };
      large?: { source_url: string };
    };
  };
}

// WordPress API configuration
// Set your WordPress URL here or via environment variable
const WP_API_URL = import.meta.env.VITE_WORDPRESS_API_URL || '';

// Emit the "not configured" notice at most once, and only in development,
// so an absent VITE_WORDPRESS_API_URL never floods the console in production.
let hasWarnedMissingUrl = false;

class WordPressClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    if (!this.baseUrl) {
      if (import.meta.env.DEV && !hasWarnedMissingUrl) {
        hasWarnedMissingUrl = true;
        console.info(
          '[WordPress] VITE_WORDPRESS_API_URL non définie — le contenu CMS (blog) est désactivé.'
        );
      }
      return [] as T;
    }

    const url = new URL(`${this.baseUrl}/wp-json/wp/v2${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    // Always embed media and terms
    url.searchParams.append('_embed', 'true');

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('WordPress API fetch error:', error);
      throw error;
    }
  }

  // Posts
  async getPosts(params?: { 
    page?: number; 
    perPage?: number; 
    category?: number;
    search?: string;
  }): Promise<WPPost[]> {
    return this.fetch<WPPost[]>('/posts', {
      page: params?.page || 1,
      per_page: params?.perPage || 10,
      ...(params?.category && { categories: params.category }),
      ...(params?.search && { search: params.search }),
    });
  }

  async getPost(slug: string): Promise<WPPost | null> {
    const posts = await this.fetch<WPPost[]>('/posts', { slug });
    return posts[0] || null;
  }

  async getPostById(id: number): Promise<WPPost> {
    return this.fetch<WPPost>(`/posts/${id}`);
  }

  // Pages
  async getPages(): Promise<WPPage[]> {
    return this.fetch<WPPage[]>('/pages', { per_page: 100 });
  }

  async getPage(slug: string): Promise<WPPage | null> {
    const pages = await this.fetch<WPPage[]>('/pages', { slug });
    return pages[0] || null;
  }

  async getPageById(id: number): Promise<WPPage> {
    return this.fetch<WPPage>(`/pages/${id}`);
  }

  // Categories
  async getCategories(): Promise<WPCategory[]> {
    return this.fetch<WPCategory[]>('/categories', { per_page: 100 });
  }

  // Media
  async getMedia(id: number): Promise<WPMedia> {
    return this.fetch<WPMedia>(`/media/${id}`);
  }

  // Custom Post Types (for testimonials, FAQ, etc.)
  // Requires custom post types to be registered in WordPress
  async getTestimonials(): Promise<WPTestimonial[]> {
    try {
      return this.fetch<WPTestimonial[]>('/testimonials', { per_page: 20 });
    } catch {
      console.warn('Testimonials custom post type not available');
      return [];
    }
  }

  async getFAQs(): Promise<Array<{ id: number; title: { rendered: string }; content: { rendered: string } }>> {
    try {
      return this.fetch('/faqs', { per_page: 50 });
    } catch {
      console.warn('FAQ custom post type not available');
      return [];
    }
  }

  // Check if WordPress is configured and reachable
  async isAvailable(): Promise<boolean> {
    if (!this.baseUrl) return false;
    
    try {
      const response = await fetch(`${this.baseUrl}/wp-json/`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const wordpress = new WordPressClient(WP_API_URL);

// Export class for custom instances
export { WordPressClient };
