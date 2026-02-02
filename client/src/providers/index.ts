import { ImageResult, Theme, ImageSource } from '../types';

export interface ImageProvider {
  search(theme: Theme | string, orientation?: 'landscape' | 'portrait', minWidth?: number, minHeight?: number, page?: number): Promise<ImageResult[]>;
}

class PexelsProvider implements ImageProvider {
  async search(theme: Theme | string, orientation?: 'landscape' | 'portrait', minWidth?: number, minHeight?: number, page: number = 1): Promise<ImageResult[]> {
    // If theme is a custom string (from weather), use it directly
    const query = typeof theme === 'string' && !['nature', 'space', 'cities', 'abstract', 'random'].includes(theme)
      ? theme
      : this.getQueryForTheme(theme as Theme);

    try {
      const response = await fetch(`/api/images/pexels?query=${encodeURIComponent(query)}&per_page=10&page=${page}`);
      const data = await response.json();
      return data.images || [];
    } catch (error) {
      console.error('Pexels fetch error:', error);
      return [];
    }
  }

  private getQueryForTheme(theme: Theme): string {
    const queries = {
      nature: 'nature landscape mountains forest',
      space: 'space galaxy nebula stars',
      cities: 'city skyline architecture urban',
      abstract: 'abstract patterns colors',
      random: '',
    };
    return queries[theme];
  }
}

class UnsplashProvider implements ImageProvider {
  async search(theme: Theme | string, orientation?: 'landscape' | 'portrait', minWidth?: number, minHeight?: number, page: number = 1): Promise<ImageResult[]> {
    // If theme is a custom string (from weather), use it directly
    const query = typeof theme === 'string' && !['nature', 'space', 'cities', 'abstract', 'random'].includes(theme)
      ? theme
      : this.getQueryForTheme(theme as Theme);

    try {
      const response = await fetch(`/api/images/unsplash?query=${encodeURIComponent(query)}&per_page=10&page=${page}`);
      const data = await response.json();
      return data.images || [];
    } catch (error) {
      console.error('Unsplash fetch error:', error);
      return [];
    }
  }

  private getQueryForTheme(theme: Theme): string {
    const queries = {
      nature: 'nature landscape',
      space: 'space astronomy',
      cities: 'city architecture',
      abstract: 'abstract art',
      random: 'wallpaper',
    };
    return queries[theme];
  }
}

class PixabayProvider implements ImageProvider {
  async search(theme: Theme | string, orientation?: 'landscape' | 'portrait', minWidth?: number, minHeight?: number, page: number = 1): Promise<ImageResult[]> {
    // If theme is a custom string (from weather), use it directly
    const query = typeof theme === 'string' && !['nature', 'space', 'cities', 'abstract', 'random'].includes(theme)
      ? theme
      : this.getQueryForTheme(theme as Theme);

    try {
      const response = await fetch(`/api/images/pixabay?query=${encodeURIComponent(query)}&per_page=10&page=${page}`);
      const data = await response.json();
      return data.images || [];
    } catch (error) {
      console.error('Pixabay fetch error:', error);
      return [];
    }
  }

  private getQueryForTheme(theme: Theme): string {
    const queries = {
      nature: 'nature landscape mountains',
      space: 'space galaxy stars',
      cities: 'city architecture urban',
      abstract: 'abstract background',
      random: 'wallpaper',
    };
    return queries[theme];
  }
}

class PicsumProvider implements ImageProvider {
  async search(): Promise<ImageResult[]> {
    // Picsum is a simple random image provider
    const images: ImageResult[] = [];

    for (let i = 0; i < 10; i++) {
      const id = Math.floor(Math.random() * 1000);
      images.push({
        id: `picsum-${id}`,
        url: `https://picsum.photos/1920/1080?random=${id}`,
        photographerName: 'Lorem Picsum',
        photographerUrl: 'https://picsum.photos',
        sourceName: 'Picsum Photos',
        sourceUrl: 'https://picsum.photos',
        attributionText: 'Photo from Picsum Photos',
      });
    }

    return images;
  }
}

const providers = {
  pexels: new PexelsProvider(),
  unsplash: new UnsplashProvider(),
  pixabay: new PixabayProvider(),
  nasa: new PicsumProvider(), // Placeholder until NASA is implemented
};

export function getImageProvider(source: ImageSource): ImageProvider {
  return providers[source];
}
