import Banner from '../components/Banner';
import Category from '../components/Category';
import Products from '../components/Products';

const HOME_BACKGROUND_IMAGE = "/hero-bg2.jpg";

const Home = () => {
  return (
    <div
      style={{
        backgroundImage: `linear-gradient(rgba(28,20,16,0.62), rgba(248,245,241,0.94) 42%, rgba(248,245,241,0.98)), url(${HOME_BACKGROUND_IMAGE})`,
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <Banner />
      <Category />
      <Products />
    </div>
  );
};

export default Home;
