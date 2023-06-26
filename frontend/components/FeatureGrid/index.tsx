import styles from './FeatureGrid.module.css';
import Image from 'next/image';

type FeatureGridProps = {
  title: string,
  svgLoc: string,
  description: string,
}

const FeatureGrid = ({ title, svgLoc, description }: FeatureGridProps) => (
  <div className={styles.container}>
    <Image src={svgLoc} alt={title} height='64px' width='64px' />
    <div className={styles.title}>{title}</div>
    <div className={styles.description}>{description}</div>
  </div>
);

export default FeatureGrid;
