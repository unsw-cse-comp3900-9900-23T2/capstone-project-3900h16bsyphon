import { CardActionArea, Typography } from '@mui/material';
import styles from './TagBox.module.css';
import FireplaceSharp from '@mui/icons-material/FireplaceSharp';

type TagBoxProps = {
    text: string,
    backgroundColor: string,
    color: string,
    isPriority?: boolean,
    onClick?: () => void,
    bold?: boolean,
}

const TagBox = ({ text, backgroundColor, color, bold = true, onClick, isPriority }: TagBoxProps) => (
  <CardActionArea onClick={onClick} className={styles.tagContainer} style={{ backgroundColor: isPriority ? '#EDB6B6' : backgroundColor }} >
    <Typography style={{ color, fontWeight: bold ? 'bold' : 'normal' }} variant='body1'>{text}</Typography>
    {isPriority && <FireplaceSharp aria-label='priority tag' /> }
  </CardActionArea>
);

export default TagBox;
