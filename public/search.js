const MELODY_API_KEY = 'f295c8a3bed16caf780ee1a576d7863f';
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
 * Creates HTML element for artist display
 * @param {Object} data - Artist data
 * @returns {HTMLElement} - Artist element
 */
function createArtistElement(data) {
  const imageUrl = data.image?.[2]?.['#text'] || 'icons/default-artist.png';
  const element = document.createElement('a');
  element.className = 'artists__item';
  element.href = data.url;
  element.style.backgroundImage = `url(${imageUrl})`;
  
  const info = document.createElement('div');
  info.className = 'artists__info';
  
  const name = document.createElement('h3');
  name.className = 'artists__name';
  name.textContent = data.name;
  
  const listeners = document.createElement('p');
  listeners.className = 'artists__listeners';
  listeners.textContent = `${data.listeners} listeners`;
  
  info.append(name, listeners);
  element.append(info);
  return element;
}

/**
 * Creates HTML element for album display
 * @param {Object} data - Album data
 * @returns {HTMLElement} - Album element
 */
function createAlbumElement(data) {
  const imageUrl = data.image?.[2]?.['#text'] || 'icons/default-album.png';
  const element = document.createElement('a');
  element.className = 'albums__item';
  element.href = data.url;
  element.style.backgroundImage = `url(${imageUrl})`;
  
  const info = document.createElement('div');
  info.className = 'albums__info';
  
  const name = document.createElement('h3');
  name.className = 'albums__name';
  name.textContent = data.name;
  
  const artist = document.createElement('p');
  artist.className = 'albums__artist';
  artist.textContent = data.artist;
  
  info.append(name, artist);
  element.append(info);
  return element;
}

/**
 * Updates section visibility
 * @param {string} selector - Element selector
 * @param {boolean} visible - Visibility state
 */
function updateSectionVisibility(selector, visible) {
  const element = document.querySelector(selector);
  if (element) element.style.display = visible ? '' : 'none';
}

/**
 * Fetches track metadata
 * @param {string} artist - Artist name
 * @param {string} track - Track name
 * @param {string} fallbackImage - Default image URL
 * @returns {Promise<Object>} - Track metadata
 */
async function fetchTrackMetadata(artist, track, fallbackImage) {
  try {
    const { track: info = {} } = await callApi('track.getInfo', { artist, track });
    const durationMs = parseInt(info.duration, 10);
    const duration = isNaN(durationMs)
      ? ''
      : `${Math.floor(durationMs / 60000)}:${('0'+Math.floor((durationMs/1000)%60)).slice(-2)}`;
    const artistUrl = info.artist?.url || '#';
    const imageUrl = info.album?.image?.find(img => img.size==='medium')?.['#text']
      || info.album?.image?.[0]?.['#text']
      || fallbackImage;
    return { duration, artistUrl, imageUrl };
  } catch {
    return { duration: '', artistUrl: '#', imageUrl: fallbackImage };
  }
}

/**
 * Updates content in container
 * @param {string} selector - Container selector
 * @param {Array} items - Items to display
 * @param {Function} createElement - Element creation function
 * @param {string} emptyMessage - Message for empty state
 */
function updateContainer(selector, items, createElement, emptyMessage) {
  const container = document.querySelector(selector);
  container.innerHTML = '';
  if (!items.length) {
    container.innerHTML = `<p class="no-results-message">${emptyMessage}</p>`;
  } else {
    items.forEach(item => container.append(createElement(item)));
  }
}

/**
 * Fetches artist search results
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Search results
 */
async function findArtists(query) { 
  const response = await callApi('artist.search', { artist: query, limit: 8 });
  return response.results.artistmatches.artist || [];
}

/**
 * Fetches album search results
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Search results
 */
async function findAlbums(query) {
  const response = await callApi('album.search', { album: query, limit: 8 });
  return response.results.albummatches.album || [];
}

/**
 * Fetches track search results
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Search results
 */
async function findTracks(query) {
  const response = await callApi('track.search', { track: query, limit: 10 });
  return response.results.trackmatches.track || [];
}

/**
 * Renders track list
 * @param {Array} tracks - Track data
 */
async function displayTracks(tracks) {
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
    const { duration, artistUrl, imageUrl } = await fetchTrackMetadata(track.artist, track.name, defaultImage);

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
 * Initializes search functionality
 */
async function setupSearch() {
  const query = new URLSearchParams(location.search).get('q')?.trim();
  if (!query) {
    document.querySelectorAll('.artists, .albums, .tracks, .search-results__header')
      .forEach(element => updateSectionVisibility(`.${element.className}`, false));
    return;
  }

  updateSectionVisibility('.search-results__header', true);
  updateSectionVisibility('.search-results__tabs', true);
  document.querySelector('.search-results__title').textContent = `Search results for "${query}"`;

  try {
    const [artists, albums, tracks] = await Promise.all([
      findArtists(query),
      findAlbums(query),
      findTracks(query)
    ]);
    
    updateContainer('.artists__grid', artists, createArtistElement, 'No artists found.');
    updateSectionVisibility('.artists', true);

    updateContainer('.albums__grid', albums, createAlbumElement, 'No albums found.');
    updateSectionVisibility('.albums', true);

    await displayTracks(tracks);
    updateSectionVisibility('.tracks', true);

  } catch (error) {
    console.error('Search error:', error);
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', setupSearch);
