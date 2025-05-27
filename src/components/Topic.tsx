import { useEffect, useState } from 'react';
import { fetchTopArtists as loadPopularArtists, lookupArtistTags as fetchArtistTags, Artist, Tag } from '../api/queries';

export default function HotRightNowBlock() {
  const [topArtists, setTopArtists] = useState<Artist[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await loadPopularArtists();
        setTopArtists(data);
      } catch (err) {
        console.error('Failed to load artists:', err);
      }
    })();
  }, []);

  return (
    <section className="hot-right-now">
      <header>
        <h2 className="hot-right-now__title">Hot right now</h2>
        <div className="hot-right-now__underline" />
      </header>
      <div className="hot-right-now__grid">
        {topArtists.map((artist) => (
          <ArtistCard key={artist.name} artist={artist} />
        ))}
      </div>
    </section>
  );
}

function ArtistCard({ artist }: { artist: Artist }) {
  const imgUrl = artist.image?.[2]?.['#text'] || '';

  return (
    <div className="hot-right-now__item">
      <a href={artist.url} className="hot-right-now__media">
        {imgUrl && (
          <img
            className="hot-right-now__thumb"
            src={imgUrl}
            alt={artist.name}
            loading="eager"
            width={120}
            height={120}
          />
        )}
        <p className="hot-right-now__name">{artist.name}</p>
      </a>
      <ArtistTagList artistName={artist.name} />
    </div>
  );
}

function ArtistTagList({ artistName }: { artistName: string }) {
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const tagList = await fetchArtistTags(artistName);
        setTags(tagList);
      } catch {
      }
    })();
  }, [artistName]);

  if (!tags.length) return null;

  return (
    <p className="hot-right-now__tags">
      {tags.map((tag) => (
        <a key={tag.name} href={tag.url} className="hot-right-now__tag">
          {tag.name}
        </a>
      ))}
    </p>
  );
}
