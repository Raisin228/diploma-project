const MELODY_API_KEY = '745385fbfeddcc339e341dd309fc650d';
const MELODY_API_BASE = 'https://ws.audioscrobbler.com/2.0/';

/**
 * Makes an API request to the music service
 * @param {string} endpoint - API endpoint name
 * @param {Object} [options={}] - Additional parameters
 * @returns {Promise<any>} - Parsed JSON response
 * @throws {Error} - If response status is not ok
 */
async function makeApiRequest(endpoint, options = {}) {
  const requestUrl = new URL(MELODY_API_BASE);
  Object.entries({ method: endpoint, api_key: MELODY_API_KEY, format: 'json', ...options })
    .forEach(([key, value]) => value != null && requestUrl.searchParams.set(key, String(value)));
  const response = await fetch(requestUrl);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

/**
 * Fetches trending artists
 * @param {number} [count=12] - Number of artists to return
 * @returns {Promise<Artist[]>} - Array of trending artists
 */
async function fetchTrendingArtists(count = 12) {
  const response = await makeApiRequest('chart.gettopartists', { limit: count });
  return response.artists?.artist || [];
}

/**
 * Fetches popular tracks
 * @param {number} [count=18] - Number of tracks to return
 * @returns {Promise<Track[]>} - Array of popular tracks
 */
async function fetchPopularTracks(count = 18) {
  const response = await makeApiRequest('chart.gettoptracks', { limit: count });
  return response.tracks?.track || [];
}

/**
 * Fetches artist tags
 * @param {string} artistName - Artist name
 * @param {number} [count=3] - Number of tags to return
 * @returns {Promise<Tag[]>} - Array of artist tags
 */
async function fetchArtistTags(artistName, count = 3) {
  try {
    const { toptags } = await makeApiRequest('artist.gettoptags', { artist: artistName });
    return (toptags?.tag || []).filter(tag => tag.url).slice(0, count);
  } catch {
    return [];
  }
}

/**
 * Fetches track tags
 * @param {string} artistName - Artist name
 * @param {string} trackName - Track name
 * @param {number} [count=3] - Number of tags to return
 * @returns {Promise<Tag[]>} - Array of track tags
 */
async function fetchTrackTags(artistName, trackName, count = 3) {
  try {
    const { toptags } = await makeApiRequest('track.gettoptags', { artist: artistName, track: trackName });
    return (toptags?.tag || []).filter(tag => tag.url).slice(0, count);
  } catch {
    return [];
  }
}

/**
 * Renders trending artists section
 * @param {Artist[]} artists - Array of artists
 */
async function renderTrendingArtists(artists) {
  const container = document.querySelector('.hot-right-now__grid');
  container.innerHTML = '';
  
  for (const artist of artists) {
    const item = document.createElement('div');
    item.className = 'hot-right-now__item';
    
    const link = document.createElement('a');
    link.className = 'hot-right-now__media';
    link.href = artist.url || '#';
    
    const image = document.createElement('img');
    image.className = 'hot-right-now__thumb';
    image.loading = 'eager';
    image.width = 120;
    image.height = 120;
    image.src = artist.image?.[2]?.['#text'] || 'icons/default-artist.png';
    image.alt = artist.name;
    
    const name = document.createElement('p');
    name.className = 'hot-right-now__name';
    name.textContent = artist.name;
    
    link.append(image, name);
    item.append(link);
    container.append(item);

    fetchArtistTags(artist.name).then(tags => {
      if (!tags.length) return;
      const tagContainer = document.createElement('p');
      tagContainer.className = 'hot-right-now__tags';
      tags.forEach(tag => {
        const tagLink = document.createElement('a');
        tagLink.className = 'hot-right-now__tag';
        tagLink.href = tag.url;
        tagLink.textContent = tag.name;
        tagContainer.append(tagLink);
      });
      item.append(tagContainer);
    });
  }
}

/**
 * Renders popular tracks section
 * @param {Track[]} tracks - Array of tracks
 */
async function renderPopularTracks(tracks) {
  const container = document.querySelector('.popular-tracks__columns');
  container.innerHTML = '';
  
  const columns = Array.from({ length: 3 }, () => {
    const column = document.createElement('div');
    column.className = 'popular-tracks__col';
    container.append(column);
    return column;
  });

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const column = columns[i % 3];
    
    const item = document.createElement('div');
    item.className = 'popular-tracks__item';
    
    const link = document.createElement('a');
    link.className = 'popular-tracks__media';
    link.href = track.url || '#';
    
    const image = document.createElement('img');
    image.className = 'popular-tracks__thumb';
    image.loading = 'lazy';
    image.src = track.image?.[2]?.['#text'] || 'icons/default-track.png';
    image.alt = track.name;
    
    link.append(image);
    item.append(link);

    const info = document.createElement('div');
    info.className = 'popular-tracks__info';
    
    const title = document.createElement('a');
    title.className = 'popular-tracks__track';
    title.textContent = track.name;
    title.href = track.url || '#';
    
    const artist = document.createElement('a');
    artist.className = 'popular-tracks__artist';
    artist.textContent = track.artist?.name || '';
    artist.href = track.artist?.url || '#';
    
    info.append(title, artist);
    item.append(info);
    column.append(item);

    fetchTrackTags(track.artist?.name, track.name).then(tags => {
      if (!tags.length) return;
      const tagContainer = document.createElement('p');
      tagContainer.className = 'popular-tracks__tags';
      tags.forEach(tag => {
        const tagLink = document.createElement('a');
        tagLink.className = 'popular-tracks__tag';
        tagLink.href = tag.url;
        tagLink.textContent = tag.name;
        tagContainer.append(tagLink);
      });
      info.append(tagContainer);
    });
  }
}

/**
 * Initializes the home page
 */
async function initializeHomePage() {
  try {
    const [artists, tracks] = await Promise.all([
      fetchTrendingArtists(),
      fetchPopularTracks()
    ]);
    await renderTrendingArtists(artists);
    await renderPopularTracks(tracks);
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', initializeHomePage);
