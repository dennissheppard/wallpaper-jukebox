interface ImageResult {
  id: string;
  url: string;
  photographerName: string;
  photographerUrl: string;
  sourceName: string;
  sourceUrl: string;
  attributionText: string;
}

export async function fetchPexelsImages(query: string, perPage: number = 10): Promise<ImageResult[]> {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    console.warn('PEXELS_API_KEY not set, returning mock data');
    return getMockImages(perPage);
  }

  try {
    const url = query
      ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`
      : `https://api.pexels.com/v1/curated?per_page=${perPage}`;

    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.photos.map((photo: any) => ({
      id: `pexels-${photo.id}`,
      url: photo.src.large2x || photo.src.large,
      photographerName: photo.photographer,
      photographerUrl: photo.photographer_url,
      sourceName: 'Pexels',
      sourceUrl: photo.url,
      attributionText: `Photo by ${photo.photographer} on Pexels`,
    }));
  } catch (error) {
    console.error('Pexels fetch error:', error);
    return getMockImages(perPage);
  }
}

export async function fetchUnsplashImages(query: string, perPage: number = 10): Promise<ImageResult[]> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!apiKey) {
    console.warn('UNSPLASH_ACCESS_KEY not set, returning mock data');
    return getMockImages(perPage);
  }

  try {
    const url = query
      ? `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`
      : `https://api.unsplash.com/photos?per_page=${perPage}`;

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

    return photos.map((photo: any) => ({
      id: `unsplash-${photo.id}`,
      url: photo.urls.full,
      photographerName: photo.user.name,
      photographerUrl: photo.user.links.html + '?utm_source=wallpaper-jukebox&utm_medium=referral',
      sourceName: 'Unsplash',
      sourceUrl: photo.links.html + '?utm_source=wallpaper-jukebox&utm_medium=referral',
      attributionText: `Photo by ${photo.user.name} on Unsplash`,
    }));
  } catch (error) {
    console.error('Unsplash fetch error:', error);
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
