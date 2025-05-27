const MELODY_API_KEY = 'f295c8a3bed16caf780ee1a576d7863f';
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
 * Searches for artists
 * @param {string} query - Search query
 * @returns {Promise<Artist[]>} - Array of found artists
 */
async function searchArtists(query) { 
  const response = await makeApiRequest('artist.search', { artist: query, limit: 8 });
  return response.results.artistmatches.artist || [];
}

/**
 * Searches for albums
 * @param {string} query - Search query
 * @returns {Promise<Album[]>} - Array of found albums
 */
async function searchAlbums(query) {
  const response = await makeApiRequest('album.search', { album: query, limit: 8 });
  return response.results.albummatches.album || [];
}

/**
 * Searches for tracks
 * @param {string} query - Search query
 * @returns {Promise<Track[]>} - Array of found tracks
 */
async function searchTracks(query) {
  const response = await makeApiRequest('track.search', { track: query, limit: 10 });
  return response.results.trackmatches.track || [];
}

/**
 * Gets additional track information
 * @param {string} artistName - Artist name
 * @param {string} trackName - Track name
 * @param {string} defaultImage - Default image URL
 * @returns {Promise<TrackInfo>} - Track duration, artist URL and image
 */
async function getTrackDetails(artistName, trackName, defaultImage) {
  try {
    const { track: info = {} } = await makeApiRequest('track.getInfo', { artist: artistName, track: trackName });
    const durationMs = parseInt(info.duration, 10);
    const duration = isNaN(durationMs)
      ? ''
      : `${Math.floor(durationMs / 60000)}:${('0'+Math.floor((durationMs/1000)%60)).slice(-2)}`;
    const artistUrl = info.artist?.url || '#';
    const imageUrl = info.album?.image?.find(img => img.size==='medium')?.['#text']
      || info.album?.image?.[0]?.['#text']
      || defaultImage;
    return { duration, artistUrl, imageUrl };
  } catch {
    return { duration: '', artistUrl: '#', imageUrl: defaultImage };
  }
}

/**
 * Renders items in a container
 * @param {string} selector - Container selector
 * @param {Array} items - Array of items to render
 * @param {Function} template - Template function for creating elements
 * @param {string} emptyMessage - Message to show when no items found
 */
function renderItems(selector, items, template, emptyMessage) {
  const container = document.querySelector(selector);
  container.innerHTML = '';
  if (!items.length) {
    container.innerHTML = `<p class="no-results-message">${emptyMessage}</p>`;
  } else {
    items.forEach(item => container.append(template(item)));
  }
}

/**
 * Template for rendering an artist
 * @param {Artist} artist - Artist object
 * @returns {HTMLElement} - Rendered artist element
 */
function artistTemplate(artist) {
  const imageUrl = artist.image?.[2]?.['#text'] || 'icons/default-artist.png';
  const element = document.createElement('a');
  element.className = 'artists__item';
  element.href = artist.url;
  element.style.backgroundImage = `url(${imageUrl})`;
  
  const info = document.createElement('div');
  info.className = 'artists__info';
  
  const name = document.createElement('h3');
  name.className = 'artists__name';
  name.textContent = artist.name;
  
  const listeners = document.createElement('p');
  listeners.className = 'artists__listeners';
  listeners.textContent = `${artist.listeners} listeners`;
  
  info.append(name, listeners);
  element.append(info);
  return element;
}

/**
 * Template for rendering an album
 * @param {Album} album - Album object
 * @returns {HTMLElement} - Rendered album element
 */
function albumTemplate(album) {
  const imageUrl = album.image?.[2]?.['#text'] || 'icons/default-album.png';
  const element = document.createElement('a');
  element.className = 'albums__item';
  element.href = album.url;
  element.style.backgroundImage = `url(${imageUrl})`;
  
  const info = document.createElement('div');
  info.className = 'albums__info';
  
  const name = document.createElement('h3');
  name.className = 'albums__name';
  name.textContent = album.name;
  
  const artist = document.createElement('p');
  artist.className = 'albums__artist';
  artist.textContent = album.artist;
  
  info.append(name, artist);
  element.append(info);
  return element;
}

/**
 * Renders track list with additional information
 * @param {Track[]} tracks - Array of tracks
 */
async function renderTracks(tracks) {
  const list = document.querySelector('.tracks__list');
  list.innerHTML = '';
  
  if (!tracks.length) {
    const message = document.createElement('p');
    message.className = 'no-results-message';
    message.textContent = 'No tracks found.';
    list.append(message);
    return;
  }
  
  for (const track of tracks) {
    const defaultImage = track.image?.[1]?.['#text'] || 'icons/default-track.png';
    const { duration, artistUrl, imageUrl } = await getTrackDetails(track.artist, track.name, defaultImage);

    const item = document.createElement('li');
    item.className = 'tracks__item';
    
    const playButton = document.createElement('button');
    playButton.className = 'tracks__play-btn';
    playButton.ariaLabel = 'Play';
    
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = track.name;
    image.className = 'tracks__image';

    const trackLink = document.createElement('a');
    trackLink.href = track.url;
    trackLink.className = 'tracks__name';
    trackLink.textContent = track.name;

    const artistLink = document.createElement('a');
    artistLink.href = artistUrl;
    artistLink.className = 'tracks__artist';
    artistLink.textContent = track.artist;

    const durationElement = document.createElement('div');
    durationElement.className = 'tracks__duration';
    durationElement.textContent = duration;

    item.append(playButton, image, trackLink, artistLink, durationElement);
    list.append(item);
  }
}

/**
 * Shows or hides a section
 * @param {string} selector - Section selector
 * @param {boolean} show - Whether to show or hide
 */
function toggleSection(selector, show) {
  const element = document.querySelector(selector);
  if (element) element.style.display = show ? '' : 'none';
}

/**
 * Initializes the search page
 */
async function initializeSearchPage() {
  const query = new URLSearchParams(location.search).get('q')?.trim();
  if (!query) {
    document.querySelectorAll('.artists, .albums, .tracks, .search-results__header')
      .forEach(element => toggleSection(`.${element.className}`, false));
    return;
  }

  toggleSection('.search-results__header', true);
  toggleSection('.search-results__tabs', true);
  document.querySelector('.search-results__title').textContent = `Search results for "${query}"`;

  try {
    const [artists, albums, tracks] = await Promise.all([
      searchArtists(query),
      searchAlbums(query),
      searchTracks(query)
    ]);
    
    renderItems('.artists__grid', artists, artistTemplate, 'No artists found.');
    toggleSection('.artists', true);

    renderItems('.albums__grid', albums, albumTemplate, 'No albums found.');
    toggleSection('.albums', true);

    await renderTracks(tracks);
    toggleSection('.tracks', true);

  } catch (error) {
    console.error('Search error:', error);
  }
}

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', initializeSearchPage);
