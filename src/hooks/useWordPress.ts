import { useQuery } from '@tanstack/react-query';
import { wordpress, WPPost, WPPage, WPCategory, WPTestimonial } from '@/lib/wordpress';

// Hook for fetching WordPress posts
export function useWPPosts(params?: {
  page?: number;
  perPage?: number;
  category?: number;
  search?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['wp-posts', params],
    queryFn: () => wordpress.getPosts(params),
    enabled: params?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook for fetching a single post by slug
export function useWPPost(slug: string, enabled = true) {
  return useQuery({
    queryKey: ['wp-post', slug],
    queryFn: () => wordpress.getPost(slug),
    enabled: !!slug && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for fetching WordPress pages
export function useWPPages(enabled = true) {
  return useQuery({
    queryKey: ['wp-pages'],
    queryFn: () => wordpress.getPages(),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for fetching a single page by slug
export function useWPPage(slug: string, enabled = true) {
  return useQuery({
    queryKey: ['wp-page', slug],
    queryFn: () => wordpress.getPage(slug),
    enabled: !!slug && enabled,
    staleTime: 10 * 60 * 1000,
  });
}

// Hook for fetching categories
export function useWPCategories(enabled = true) {
  return useQuery({
    queryKey: ['wp-categories'],
    queryFn: () => wordpress.getCategories(),
    enabled,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook for fetching testimonials (custom post type)
export function useWPTestimonials(enabled = true) {
  return useQuery({
    queryKey: ['wp-testimonials'],
    queryFn: () => wordpress.getTestimonials(),
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}

// Hook for fetching FAQs (custom post type)
export function useWPFAQs(enabled = true) {
  return useQuery({
    queryKey: ['wp-faqs'],
    queryFn: () => wordpress.getFAQs(),
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}

// Hook to check if WordPress is available
export function useWPAvailable() {
  return useQuery({
    queryKey: ['wp-available'],
    queryFn: () => wordpress.isAvailable(),
    staleTime: 60 * 1000, // 1 minute
    retry: false,
  });
}

// Helper to strip HTML tags from WordPress content
export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

// Helper to get featured image URL from embedded data
export function getFeaturedImage(post: WPPost): string | null {
  return post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
}

// Helper to get categories from embedded data
export function getCategories(post: WPPost): Array<{ id: number; name: string; slug: string }> {
  return post._embedded?.['wp:term']?.[0] || [];
}
