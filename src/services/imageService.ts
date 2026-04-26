// Image service for fetching stock photos from free APIs

export interface StockImage {
  id: string;
  url: string;
  thumbnail: string;
  author?: string;
  authorUrl?: string;
}

class ImageService {
  private readonly UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
  private readonly PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY;

  // Query overrides for ambiguous terms
  private readonly queryOverrides: Record<string, string> = {
    'leon': 'lion animal',
    'leon animal': 'lion animal',
  };

  // Lorem Picsum - No API key required, simplest option
  async getPicsumImages(count: number = 20, query?: string): Promise<StockImage[]> {
    const images: StockImage[] = [];
    
    for (let i = 0; i < count; i++) {
      // Create a more unique seed based on query and index to ensure different images
      // Use a more specific seed generation for better filtering
      const baseSeed = query ? query.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'poll';
      const randomSuffix = Math.random().toString(36).substring(7);
      const seed = `${baseSeed}-${randomSuffix}-${i}`;
      
      const url = `https://picsum.photos/seed/${seed}/800/600.jpg`;
      const thumbnail = `https://picsum.photos/seed/${seed}/200/150.jpg`;
      
      images.push({
        id: seed,
        url,
        thumbnail,
        author: 'Lorem Picsum',
        authorUrl: 'https://picsum.photos/'
      });
    }

    return images;
  }

  // Unsplash - High quality images, requires API key
  async getUnsplashImages(query: string = 'nature', count: number = 20): Promise<StockImage[]> {
    if (!this.UNSPLASH_ACCESS_KEY) {
      console.warn('Unsplash API key not found, falling back to Picsum');
      return this.getPicsumImages(count, query);
    }

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${this.UNSPLASH_ACCESS_KEY}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Unsplash API request failed');
      }

      const data = await response.json();
      
      return data.results.map((photo: {
        id: string;
        urls: { regular: string; thumb: string };
        user: { name: string; links: { html: string } };
      }) => ({
        id: photo.id,
        url: photo.urls.regular,
        thumbnail: photo.urls.thumb,
        author: photo.user.name,
        authorUrl: photo.user.links.html
      }));
    } catch (error) {
      console.error('Unsplash API error:', error);
      // Fallback to Picsum
      return this.getPicsumImages(count, query);
    }
  }

  // Pexels - Good quality images, requires API key
  async getPexelsImages(query: string = 'nature', count: number = 20, page: number = 1): Promise<StockImage[]> {
    if (!this.PEXELS_API_KEY) {
      console.warn('Pexels API key not found, falling back to Picsum');
      return this.getPicsumImages(count, query);
    }

    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&page=${page}&orientation=landscape`,
        {
          headers: {
            'Authorization': this.PEXELS_API_KEY
          }
        }
      );

      if (!response.ok) {
        throw new Error('Pexels API request failed');
      }

      const data = await response.json();
      
      return data.photos.map((photo: {
        id: number;
        src: { large: string; medium: string };
        photographer: string;
        photographer_url: string;
      }) => ({
        id: photo.id.toString(),
        url: photo.src.large,
        thumbnail: photo.src.medium,
        author: photo.photographer,
        authorUrl: photo.photographer_url
      }));
    } catch (error) {
      console.error('Pexels API error:', error);
      // Fallback to Picsum
      return this.getPicsumImages(count, query);
    }
  }

  // Pexels curated photos (default)
  async getPexelsCurated(count: number = 20, page: number = 1): Promise<StockImage[]> {
    if (!this.PEXELS_API_KEY) {
      console.warn('Pexels API key not found, falling back to Picsum');
      return this.getPicsumImages(count);
    }

    try {
      const response = await fetch(
        `https://api.pexels.com/v1/curated?per_page=${count}&page=${page}`,
        {
          headers: {
            'Authorization': this.PEXELS_API_KEY
          }
        }
      );

      if (!response.ok) {
        throw new Error('Pexels API request failed');
      }

      const data = await response.json();
      
      return data.photos.map((photo: {
        id: number;
        src: { large: string; medium: string };
        photographer: string;
        photographer_url: string;
      }) => ({
        id: photo.id.toString(),
        url: photo.src.large,
        thumbnail: photo.src.medium,
        author: photo.photographer,
        authorUrl: photo.photographer_url
      }));
    } catch (error) {
      console.error('Pexels API error:', error);
      // Fallback to Picsum
      return this.getPicsumImages(count);
    }
  }

  // Main method to get images with fallback chain
  async getStockImages(
    query: string = 'nature', 
    count: number = 20, 
    preferredService: 'unsplash' | 'pexels' | 'picsum' = 'picsum'
  ): Promise<StockImage[]> {
    switch (preferredService) {
      case 'unsplash':
        return this.getUnsplashImages(query, count);
      case 'pexels':
        return this.getPexelsImages(query, count);
      case 'picsum':
      default:
        return this.getPicsumImages(count, query);
    }
  }

  // Get random placeholder images for polls
  async getPollPlaceholders(count: number = 10): Promise<StockImage[]> {
    const categories = ['nature', 'abstract', 'technology', 'business', 'food', 'travel', 'animals', 'architecture'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    return this.getPicsumImages(count, randomCategory);
  }

  // Search images with keyword suggestions
  async searchImages(query: string, count: number = 20, page: number = 1): Promise<StockImage[]> {
    if (!query.trim()) {
      return this.getPexelsCurated(count, page);
    }

    // Apply query overrides for ambiguous terms
    const finalQuery = this.queryOverrides[query.toLowerCase()] ?? query;

    // Try to get relevant images based on query using Pexels
    return this.getPexelsImages(finalQuery, count, page);
  }
}

export const imageService = new ImageService();
