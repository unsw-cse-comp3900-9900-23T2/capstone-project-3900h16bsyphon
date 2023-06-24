import styles from './Logo.module.css';
import Link from 'next/link';

export default function Logo() {
  return <div className={styles.logo}><Link href={'/'}>Syphon</Link></div>;
}
