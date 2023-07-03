import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import styles from './CourseCard.module.css';
import React from 'react';
import { useRouter } from 'next/router';

type CourseCardProps = {
  title: string;
  index: number;
}

const CourseCard = ({ title, index }: CourseCardProps) => {
  const router = useRouter();
  return (
    <CardActionArea onClick={() => router.push(`/course/${index}`) }>
      <Card className={styles.card}>
        <CardContent>
          <Typography className={styles.heading}>
            {title}
          </Typography>
        </CardContent>
      </Card>
    </CardActionArea>
  );
};

export default CourseCard;
