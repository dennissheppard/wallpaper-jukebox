interface ImageResult {
  id: string;
  url: string;
  photographerName: string;
  photographerUrl: string;
  sourceName: string;
  sourceUrl: string;
  attributionText: string;
  tags?: string[];
}

export async function fetchPexelsImages(query: string, perPage: number = 10, page: number = 1): Promise<ImageResult[]> {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    console.warn('PEXELS_API_KEY not set, returning mock data');
    return getMockImages(perPage);
  }

  try {
    const url = query
      ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=landscape`
      : `https://api.pexels.com/v1/curated?per_page=${perPage}&page=${page}`;

    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.photos.map((photo: any) => {
      // Pexels doesn't provide direct tags in search, but 'alt' text is usually a good summary
      const tags = photo.alt 
        ? photo.alt.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter((w: string) => w.length > 3)
        : [];

      return {
        id: `pexels-${photo.id}`,
        url: photo.src.large2x || photo.src.large,
        photographerName: photo.photographer,
        photographerUrl: photo.photographer_url,
        sourceName: 'Pexels',
        sourceUrl: photo.url,
        attributionText: `Photo by ${photo.photographer} on Pexels`,
        tags: tags.slice(0, 10),
      };
    });
  } catch (error) {
    console.error('Pexels fetch error:', error);
    return getMockImages(perPage);
  }
}

export async function fetchUnsplashImages(query: string, perPage: number = 10, page: number = 1): Promise<ImageResult[]> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!apiKey) {
    console.warn('UNSPLASH_ACCESS_KEY not set, returning mock data');
    return getMockImages(perPage);
  }

  try {
    const url = query
      ? `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=landscape`
      : `https://api.unsplash.com/photos?per_page=${perPage}&page=${page}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.statusText}`);
    }

    const data = await response.json();
    const photos = query ? data.results : data;

    return photos.map((photo: any) => {
      // Unsplash provides tags in search results
      const tags = (photo.tags || []).map((t: any) => t.title.toLowerCase());
      
      // If no tags, fallback to description/alt_description
      if (tags.length === 0 && (photo.description || photo.alt_description)) {
        const desc = (photo.description || photo.alt_description).toLowerCase();
        tags.push(...desc.replace(/[^\w\s]/g, '').split(/\s+/).filter((w: string) => w.length > 3));
      }

      return {
        id: `unsplash-${photo.id}`,
        url: photo.urls.full,
        photographerName: photo.user.name,
        photographerUrl: photo.user.links.html + '?utm_source=wallpaper-jukebox&utm_medium=referral',
        sourceName: 'Unsplash',
        sourceUrl: photo.links.html + '?utm_source=wallpaper-jukebox&utm_medium=referral',
        attributionText: `Photo by ${photo.user.name} on Unsplash`,
        tags: tags.slice(0, 10),
      };
    });
  } catch (error) {
    console.error('Unsplash fetch error:', error);
    return getMockImages(perPage);
  }
}

export async function fetchPixabayImages(query: string, perPage: number = 10, page: number = 1): Promise<ImageResult[]> {
  const apiKey = process.env.PIXABAY_API_KEY;

  if (!apiKey) {
    console.warn('PIXABAY_API_KEY not set, returning mock data');
    return getMockImages(perPage);
  }

  try {
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&per_page=${perPage}&page=${page}&orientation=horizontal&safesearch=true`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.hits.map((photo: any) => ({
      id: `pixabay-${photo.id}`,
      url: photo.largeImageURL || photo.webformatURL,
      photographerName: photo.user,
      photographerUrl: `https://pixabay.com/users/${photo.user}-${photo.user_id}/`,
      sourceName: 'Pixabay',
      sourceUrl: photo.pageURL,
      attributionText: `Photo by ${photo.user} on Pixabay`,
      tags: photo.tags ? photo.tags.split(',').map((t: string) => t.trim().toLowerCase()) : [],
    }));
  } catch (error) {
    console.error('Pixabay fetch error:', error);
    return getMockImages(perPage);
  }
}

function getMockImages(count: number): ImageResult[] {
  const images: ImageResult[] = [];
  for (let i = 0; i < count; i++) {
    const id = Math.floor(Math.random() * 1000) + Date.now();
    images.push({
      id: `mock-${id}`,
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
