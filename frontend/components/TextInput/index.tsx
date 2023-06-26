import FormControlLabel from '@mui/material/FormControlLabel';
import styles from './TextInput.module.css';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Dispatch, HTMLInputTypeAttribute, SetStateAction } from 'react';

type TextInputProps = {
  label: string,
  value: string,
  setValue: Dispatch<SetStateAction<string>>,
  type?: HTMLInputTypeAttribute
};

const TextInput = ({ label, value, setValue, type }: TextInputProps) => (
  <FormControlLabel
    className={styles.formItem} control={
      <TextField
        fullWidth
        value={value}
        onChange={(e) => setValue(e.target.value)}
        type={type}
      />
    }
    label={<Typography className={styles.label}>{label}</Typography>}
    labelPlacement='top'
  />
);

export default TextInput;
