import HotRightNow from '../components/Topic';
import PopularTracks from '../components/Tracks';
import '../styles/global.css'; 
export default function Home() {
  return (
    <>
      <div className="content__top">
        <h1 className="content__top-header">Music</h1>
      </div>
      <HotRightNow />
      <PopularTracks />
    </>
  );
}
