import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import styles from './CourseCard.module.css';
import React from 'react';

type CourseCardProps = {
  title: string;
}

const CourseCard = ({ title }: CourseCardProps) => {
  return (
    <Card className={styles.card}>
      <CardContent>
        <Typography className={styles.heading}>
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
