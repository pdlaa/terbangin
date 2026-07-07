export async function fetchDestinationImageUrl(query: string): Promise<string | null> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return null;

    const searchQuery = `${trimmedQuery} travel destination`;
    const imageUrl = await fetchPexelsImage(searchQuery);
    if (imageUrl) return imageUrl;

    return fetchUnsplashImage(searchQuery);
}

async function fetchPexelsImage(query: string): Promise<string | null> {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) return null;

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&size=medium&per_page=1`;
    const response = await fetch(url, {
        headers: {
            Authorization: apiKey,
        },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const photo = data.photos?.[0];
    return photo?.src?.landscape || photo?.src?.large || null;
}

async function fetchUnsplashImage(query: string): Promise<string | null> {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) return null;

    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1`;
    const response = await fetch(url, {
        headers: {
            Authorization: `Client-ID ${accessKey}`,
        },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const photo = data.results?.[0];
    return photo?.urls?.regular || photo?.urls?.small || null;
}
