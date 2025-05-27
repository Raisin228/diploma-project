export const API_KEY = 'f295c8a3bed16caf780ee1a576d7863f';
export const API_BASE = 'https://ws.audioscrobbler.com/2.0/';

type QueryParams = Record<string, string | number>;

async function callApi<T>(methodName: string, query: QueryParams = {}): Promise<T> {
  const queryUrl = new URL(API_BASE);
  queryUrl.searchParams.append('method', methodName);
  queryUrl.searchParams.append('api_key', API_KEY);
  queryUrl.searchParams.append('format', 'json');

  for (const key in query) {
    const val = query[key];
    if (val !== null && val !== undefined) {
      queryUrl.searchParams.append(key, String(val));
    }
  }

  const response = await fetch(queryUrl.href);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export interface Image {
  size: string;
  '#text': string;
}

export interface Tag {
  url: string;
  name: string;
}

export interface Artist {
  name: string;
  mbid: string;
  url: string;
  listeners?: string;
  image: Image[];
}

export interface Album {
  name: string;
  mbid?: string;
  url: string;
  artist: string;
  image: Image[];
}

export interface Track {
  name: string;
  mbid?: string;
  url: string;
  artist: any;
  image: Image[];
}

export interface TrackInfo {
  duration: string;
  artistUrl: string;
  imageUrl: string;
}

export async function fetchTopArtists(limit = 12): Promise<Artist[]> {
  const result = await callApi<{ artists: { artist: Artist[] } }>('chart.gettopartists', { limit });
  return result.artists?.artist ?? [];
}

export async function fetchTopTracks(limit = 18): Promise<Track[]> {
  const result = await callApi<{ tracks: { track: Track[] } }>('chart.gettoptracks', { limit });
  return result.tracks?.track ?? [];
}

export async function lookupArtistTags(name: string, tagLimit = 3): Promise<Tag[]> {
  try {
    const response = await callApi<{ toptags: { tag: Tag[] } }>('artist.gettoptags', { artist: name });
    return (response.toptags?.tag ?? []).filter(tag => Boolean(tag.url)).slice(0, tagLimit);
  } catch {
    return [];
  }
}

export async function lookupTrackTags(artistName: string, trackName: string, tagLimit = 3): Promise<Tag[]> {
  try {
    const response = await callApi<{ toptags: { tag: Tag[] } }>('track.gettoptags', {
      artist: artistName,
      track: trackName,
    });
    return (response.toptags?.tag ?? []).filter(tag => tag.url).slice(0, tagLimit);
  } catch {
    return [];
  }
}

export async function findArtists(keyword: string, max = 8): Promise<Artist[]> {
  const result = await callApi<{ results: { artistmatches: { artist: Artist[] } } }>('artist.search', {
    artist: keyword,
    limit: max,
  });
  return result.results?.artistmatches?.artist ?? [];
}

export async function findAlbums(keyword: string, max = 8): Promise<Album[]> {
  const result = await callApi<{ results: { albummatches: { album: Album[] } } }>('album.search', {
    album: keyword,
    limit: max,
  });
  return result.results?.albummatches?.album ?? [];
}

export async function findTracks(keyword: string, max = 10): Promise<Track[]> {
  const result = await callApi<{ results: { trackmatches: { track: Track[] } } }>('track.search', {
    track: keyword,
    limit: max,
  });
  return result.results?.trackmatches?.track ?? [];
}

export async function extractTrackDetails(
  artist: string,
  title: string,
  placeholderImage: string
): Promise<TrackInfo> {
  try {
    const data = await callApi<{ track: any }>('track.getInfo', { artist, track: title });
    const trackData = data.track ?? {};
    const ms = parseInt(trackData.duration ?? '', 10);
    const formattedDuration =
      !isNaN(ms) && ms > 0 ? `${Math.floor(ms / 60000)}:${String(Math.floor((ms / 1000) % 60)).padStart(2, '0')}` : '';
    const artistLink = trackData.artist?.url || '#';
    const image =
      trackData.album?.image?.find((img: Image) => img.size === 'medium')?.['#text'] ||
      trackData.album?.image?.[0]?.['#text'] ||
      placeholderImage;

    return {
      duration: formattedDuration,
      artistUrl: artistLink,
      imageUrl: image,
    };
  } catch {
    return {
      duration: '',
      artistUrl: '#',
      imageUrl: placeholderImage,
    };
  }
}
