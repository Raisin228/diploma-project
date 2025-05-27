interface MusicCardProps {
  title: string;
  artist: string;
  imageUrl: string;
}

export default function MusicCard({ title, artist, imageUrl }: MusicCardProps) {
  return (
    <div className="music-card">
      <div className="music-card__image">
        <img src={imageUrl} alt={title} />
      </div>
      <div className="music-card__content">
        <h3 className="music-card__title">{title}</h3>
        <p className="music-card__artist">{artist}</p>
      </div>
    </div>
  );
}