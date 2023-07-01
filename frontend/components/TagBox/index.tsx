import { Typography } from '@mui/material';
import styles from './TagBox.module.css';

type TagBoxProps = {
    text: string,
    backgroundColor: string,
    color: string,
    bold?: boolean,
}

const TagBox = ({ text, backgroundColor, color, bold=true }: TagBoxProps) => {
  return <div className={styles.tagContainer} style={{ backgroundColor }} >
    <Typography style={{ color, fontWeight: bold ? 'bold' : 'normal' }} variant='body1'>{text}</Typography>
  </div>;
};

export default TagBox;
