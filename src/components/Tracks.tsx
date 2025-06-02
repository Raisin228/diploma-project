import { useEffect, useState, useMemo } from 'react';
import { fetchTopTracks, lookupTrackTags, Track, Tag } from '../api/queries';

export default function PopularTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    fetchTopTracks()
      .then(setTracks)
      .catch(console.error);
  }, []);

  const cols = useMemo(() => {
    const columns: Track[][] = [[], [], []];
    tracks.forEach((track, idx) => {
      columns[idx % 3].push(track);
    });
    return columns;
  }, [tracks]);

  return (
    <section className="popular-tracks">
      <h2 className="popular-tracks__title">Popular tracks</h2>
      <div className="popular-tracks__underline" />
      <div className="popular-tracks__columns">
        {cols.map((col, i) => (
          <div key={i} className="popular-tracks__col">
            {col.map((track) => (
              <TrackItem key={track.name + track.artist.name} track={track} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function TrackItem({ track }: { track: Track }) {
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    lookupTrackTags(track.artist.name, track.name)
      .then(setTags)
      .catch(() => {});
  }, [track]);

  const imageUrl = track.image?.[2]?.['#text'] || '';

  return (
    <div className="popular-tracks__item">
      <a href={track.url} className="popular-tracks__media">
        <img
          className="popular-tracks__thumb"
          src={imageUrl}
          alt={track.name}
          loading="lazy"
        />
      </a>
      <div className="popular-tracks__info">
        <a href={track.url} className="popular-tracks__track">
          {track.name}
        </a>
        <a href={track.artist.url} className="popular-tracks__artist">
          {track.artist.name}
        </a>
        {tags.length > 0 && (
          <p className="popular-tracks__tags">
            {tags.map((t) => (
              <a key={t.name} href={t.url} className="popular-tracks__tag">
                {t.name}
              </a>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
