import styles from './ImageCarousel.module.css';
import Carousel from 'react-material-ui-carousel';

type ImageCarouselProps = {
  images: string[];
};

const ImageCarousel = ({ images }: ImageCarouselProps) => {
  return <>
    <Carousel
      navButtonsProps={{
        style: {
          backgroundColor: '#3E368F',
          borderRadius: 100,
        },
      }}
      autoPlay={false}
    >
      {images.map((image, i) => {
        return (
          <div className={styles.imageContainer} key={i}>
            {/*eslint-disable-next-line @next/next/no-img-element*/}
            <img src={`${process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL}${image}`} alt="request" />
          </div>
        );
      })}
    </Carousel>
  </>;
};

export default ImageCarousel;
