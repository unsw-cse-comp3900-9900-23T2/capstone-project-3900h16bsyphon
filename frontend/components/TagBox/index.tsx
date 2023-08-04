import { CardActionArea, Typography } from '@mui/material';
import styles from './TagBox.module.css';
import React, { JSX } from 'react';
import { useRouter } from 'next/router';

type TagBoxProps = {
    text: string | JSX.Element,
    backgroundColor: string,
    color: string,
    isPriority?: boolean,
    onClick?: () => void,
    bold?: boolean,
}


const TagBox = ({ text, backgroundColor, color, bold = true, onClick, isPriority }: TagBoxProps) => {
  const router = useRouter();

  const isZidFormat = () => {
    if ( typeof(text) !== 'string') return false;
    return text.match(/^z[0-9]{7}$/);
  };

  const userProfileOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    if ( typeof(text) !== 'string') return;
    router.push(`/user-profile/${text.substr(1)}`);
  };

  return <CardActionArea onClick={isZidFormat() ? userProfileOnClick : onClick} className={styles.tagContainer} style={{ backgroundColor: isPriority ? '#EDB6B6' : backgroundColor }} >
    <Typography style={{ color: isPriority ? '#FFF' : color, fontWeight: bold ? 'bold' : 'normal' }} variant='body1'>{text}</Typography>
    {isPriority && '🔥' }
  </CardActionArea>;
};

export default TagBox;
