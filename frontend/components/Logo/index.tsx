import styles from './Logo.module.css';
import Link from 'next/link';

const Logo = () => (<div className={styles.logo}><Link href={'/'}>Syphon</Link></div>);

export default Logo;
