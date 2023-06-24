import styles from './FeatureGrid.module.css';
import Image from 'next/image';

interface FeatureGridProps {
  title: string,
  svgLoc: string,
  description: string,
}

export default function FeatureGrid({ title, svgLoc, description }: FeatureGridProps) {
  return (
    <div className={styles.container}>
      <Image src={svgLoc} alt={title} height='64px' width='64px' />
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
