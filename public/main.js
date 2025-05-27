const MELODY_API_KEY = '745385fbfeddcc339e341dd309fc650d';
const MELODY_API_BASE = 'https://ws.audioscrobbler.com/2.0/';

/**
 * Handles API communication
 * @param {string} method - API method name
 * @param {Object} [params={}] - Request parameters
 * @returns {Promise<any>} - API response
 */
async function callApi(method, params = {}) {
  const url = new URL(MELODY_API_BASE);
  Object.entries({ method, api_key: MELODY_API_KEY, format: 'json', ...params })
    .forEach(([key, value]) => value != null && url.searchParams.set(key, String(value)));
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

/**
 * Fetches trending artists
 * @param {number} [limit=12] - Number of artists to return
 * @returns {Promise<Array>} - Array of trending artists
 */
async function getTrendingArtists(limit = 12) {
  const response = await callApi('chart.gettopartists', { limit });
  return response.artists?.artist || [];
}

/**
 * Fetches popular tracks
 * @param {number} [limit=18] - Number of tracks to return
 * @returns {Promise<Array>} - Array of popular tracks
 */
async function getPopularTracks(limit = 18) {
  const response = await callApi('chart.gettoptracks', { limit });
  return response.tracks?.track || [];
}

/**
 * Fetches artist tags
 * @param {string} artist - Artist name
 * @param {number} [limit=3] - Number of tags to return
 * @returns {Promise<Array>} - Array of artist tags
 */
async function getArtistTags(artist, limit = 3) {
  try {
    const { toptags } = await callApi('artist.gettoptags', { artist });
    return (toptags?.tag || []).filter(tag => tag.url).slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Fetches track tags
 * @param {string} artist - Artist name
 * @param {string} track - Track name
 * @param {number} [limit=3] - Number of tags to return
 * @returns {Promise<Array>} - Array of track tags
 */
async function getTrackTags(artist, track, limit = 3) {
  try {
    const { toptags } = await callApi('track.gettoptags', { artist, track });
    return (toptags?.tag || []).filter(tag => tag.url).slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Creates HTML element for trending artist
 * @param {Object} data - Artist data
 * @returns {HTMLElement} - Artist element
 */
function createTrendingArtistElement(data) {
  const item = document.createElement('div');
  item.className = 'hot-right-now__item';
  
  const link = document.createElement('a');
  link.className = 'hot-right-now__media';
  link.href = data.url || '#';
  
  const image = document.createElement('img');
  image.className = 'hot-right-now__thumb';
  image.loading = 'eager';
  image.width = 120;
  image.height = 120;
  image.src = data.image?.[2]?.['#text'] || 'icons/default-artist.png';
  image.alt = data.name;
  
  const name = document.createElement('p');
  name.className = 'hot-right-now__name';
  name.textContent = data.name;
  
  link.append(image, name);
  item.append(link);
  return item;
}

/**
 * Creates HTML element for popular track
 * @param {Object} data - Track data
 * @returns {HTMLElement} - Track element
 */
function createPopularTrackElement(data) {
  const item = document.createElement('div');
  item.className = 'popular-tracks__item';
  
  const link = document.createElement('a');
  link.className = 'popular-tracks__media';
  link.href = data.url || '#';
  
  const image = document.createElement('img');
  image.className = 'popular-tracks__thumb';
  image.loading = 'lazy';
  image.src = data.image?.[2]?.['#text'] || 'icons/default-track.png';
  image.alt = data.name;
  
  link.append(image);
  item.append(link);

  const info = document.createElement('div');
  info.className = 'popular-tracks__info';
  
  const title = document.createElement('a');
  title.className = 'popular-tracks__track';
  title.textContent = data.name;
  title.href = data.url || '#';
  
  const artist = document.createElement('a');
  artist.className = 'popular-tracks__artist';
  artist.textContent = data.artist?.name || '';
  artist.href = data.artist?.url || '#';
  
  info.append(title, artist);
  item.append(info);
  return item;
}

/**
 * Updates trending artists section
 * @param {Array} artists - Array of artists
 */
async function updateTrendingArtists(artists) {
  const container = document.querySelector('.hot-right-now__grid');
  container.innerHTML = '';
  
  for (const artist of artists) {
    const item = createTrendingArtistElement(artist);
    container.append(item);

    getArtistTags(artist.name).then(tags => {
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
 * Updates popular tracks section
 * @param {Array} tracks - Array of tracks
 */
async function updatePopularTracks(tracks) {
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
    const item = createPopularTrackElement(track);
    column.append(item);

    getTrackTags(track.artist?.name, track.name).then(tags => {
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
      item.querySelector('.popular-tracks__info').append(tagContainer);
    });
  }
}

/**
 * Initializes home page
 */
async function setupHomePage() {
  try {
    const [artists, tracks] = await Promise.all([
      getTrendingArtists(),
      getPopularTracks()
    ]);
    await updateTrendingArtists(artists);
    await updatePopularTracks(tracks);
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', setupHomePage);
