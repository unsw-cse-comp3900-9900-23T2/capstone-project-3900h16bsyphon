import MuiButton, { ButtonProps } from '@mui/material/Button';
import styles from './Button.module.css';

const Button = ({ children, ...props }: ButtonProps) => {
  return (
    <MuiButton className={[styles.button, props.className].join(' ')} {...props}>
      {children}
    </MuiButton>
  );
};

export default Button;
