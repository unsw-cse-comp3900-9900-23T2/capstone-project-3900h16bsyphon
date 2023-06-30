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
  index: number;
  inviteCode: string;  
}

const CourseOfferingCard = ({ title, inviteCode, index } : CourseOfferingCardProps) => {
  return (
    <Card>
      <CardContent>
        <Typography className={styles.heading}>
          {title}
        </Typography>
      </CardContent>
      <CardActions>
        <Link href={`/queue/${index}`}><Button disableElevation className={styles.queueBtn}>QUEUES</Button></Link>
        <Button disableElevation className={styles.analyticsBtn}>ANALYTICS</Button>
        <Link href={`/queue/${index}`}><Button disableElevation className={styles.tutorPageBtn}>TUTOR PAGE</Button></Link>
        <TutorInviteModal inviteCode={inviteCode}/>
      </CardActions>
    </Card>
  );
};

export default CourseOfferingCard;
