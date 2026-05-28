import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Service to search for illustration images for educational concepts.
 * Uses web scraping with axios and cheerio.
 */
export async function searchIllustrationImages(concept: string): Promise<string[]> {
  try {
    const query = encodeURIComponent(`${concept} educational illustration`);
    const url = `https://www.google.com/search?q=${query}&tbm=isch&safe=active`;

    // Use a common browser User-Agent to get a standard HTML response
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const images: string[] = [];

    // Google Images (no-js version) typically has images in table/div structures
    // In the JS version, it's more complex, but we try to find common patterns
    
    // Look for image tags that are likely the search results
    // In many scraping scenarios for Google, we look for <img> tags with a specific source pattern
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      const dataSrc = $(el).attr('data-src');
      
      const finalSrc = dataSrc || src;
      
      if (finalSrc && finalSrc.startsWith('http') && !finalSrc.includes('googlelogo') && images.length < 3) {
        images.push(finalSrc);
      }
    });

    // Fallback: If Google is blocking or changing layout, try DuckDuckGo or Wikipedia
    if (images.length === 0) {
      return await searchWikipediaImage(concept);
    }

    return images;
  } catch (error) {
    console.error(`Error scraping images for ${concept}:`, error);
    return [];
  }
}

/**
 * Fallback to Wikipedia to find a relevant image if general search fails.
 */
async function searchWikipediaImage(concept: string): Promise<string[]> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&pithumbsize=500&titles=${encodeURIComponent(concept)}&generator=search&gsrsearch=${encodeURIComponent(concept)}&gsrlimit=3`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'ARdent-Study-Educational-Tool/1.0 (https://ardent-study.com; contact@example.com)'
      }
    });
    const pages = response.data?.query?.pages;
    
    if (!pages) return [];
    
    const imageUrls = Object.values(pages)
      .map((page: any) => page.thumbnail?.source)
      .filter(url => !!url);
      
    return imageUrls.slice(0, 3);
  } catch (error) {
    console.error(`Wikipedia fallback failed for ${concept}:`, error);
    return [];
  }
}
