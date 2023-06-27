import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import styles from './CourseCard.module.css';
import React from 'react';
import Link from 'next/link';

type CourseCardProps = {
  title: string;
  index: number;
}

const CourseCard = ({ title, index }: CourseCardProps) => {
  return (
    <Link href={`/queue/${index}`}>
      <Card className={styles.card}>
        <CardContent>
          <Typography className={styles.heading}>
            {title}
          </Typography>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CourseCard;
