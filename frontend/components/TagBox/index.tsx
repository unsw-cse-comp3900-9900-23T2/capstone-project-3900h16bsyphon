import { CardActionArea, Typography } from '@mui/material';
import styles from './TagBox.module.css';
import type { JSX } from 'react';

type TagBoxProps = {
    text: string | JSX.Element,
    backgroundColor: string,
    color: string,
    isPriority?: boolean,
    onClick?: () => void,
    bold?: boolean,
}

const TagBox = ({ text, backgroundColor, color, bold = true, onClick, isPriority }: TagBoxProps) => (
  <CardActionArea onClick={onClick} className={styles.tagContainer} style={{ backgroundColor: isPriority ? '#EDB6B6' : backgroundColor }} >
    <Typography style={{ color: isPriority ? '#FFF' : color, fontWeight: bold ? 'bold' : 'normal' }} variant='body1'>{text}</Typography>
    {isPriority && '🔥' }
  </CardActionArea>
);

export default TagBox;
