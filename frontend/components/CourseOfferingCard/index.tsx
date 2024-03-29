import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import styles from './CourseOfferingCard.module.css';
import React from 'react';
import TutorInviteModal from '../TutorInviteModal';
import Link from 'next/link';

// TODO: add more props in
type CourseOfferingCardProps = {
  title: string;
  inviteCode: string;  
  courseOfferingId: number;
}

const CourseOfferingCard = ({ title, inviteCode, courseOfferingId } : CourseOfferingCardProps) => {
  return (
    <Card>
      <CardContent>
        <Typography className={styles.heading}>
          {title}
        </Typography>
      </CardContent>
      <CardActions>
        <Link href={`/course-analytics/${courseOfferingId}`}><Button disableElevation className={styles.analyticsBtn}>ANALYTICS</Button></Link>
        <Link href={`/course/${courseOfferingId}`}><Button disableElevation className={styles.tutorPageBtn}>TUTOR PAGE</Button></Link>
        <TutorInviteModal inviteCode={inviteCode}/>
      </CardActions>
    </Card>
  );
};

export default CourseOfferingCard;
