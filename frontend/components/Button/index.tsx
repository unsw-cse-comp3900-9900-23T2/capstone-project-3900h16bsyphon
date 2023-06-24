import MuiButton, { ButtonProps } from '@mui/material/Button';
import styles from './Button.module.css';

export default function Button({ children, ...props }: { children: any } & ButtonProps) {
  return (
    <MuiButton className={styles.button} {...props}>
      {children}
    </MuiButton>
  );
}
