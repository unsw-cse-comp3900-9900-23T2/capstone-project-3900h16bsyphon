import styles from './Footer.module.css';

const Footer = () => {
  return (
    <div className={styles.footer}>Syphon © { new Date().getFullYear()}</div>
  );
};

export default Footer;
