import { Typography } from '@mui/material';
import styles from './TagBox.module.css';

type TagBoxProps = {
    text: string,
    backgroundColor: string,
    color: string,
}

const TagBox = ({ text, backgroundColor, color }: TagBoxProps) => {
  return <div className={styles.tagContainer} style={{ backgroundColor }} >
    <Typography className={styles.tagText} style={{ color }} variant='body1'>{text}</Typography>
  </div>;
};

export default TagBox;
