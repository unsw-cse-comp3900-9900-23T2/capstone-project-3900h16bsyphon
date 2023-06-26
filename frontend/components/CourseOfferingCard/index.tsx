import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import styles from './CourseOfferingCard.module.css';
import React from 'react';
import TutorInviteModal from '../TutorInviteModal';

// TODO: add more props in
type CourseOfferingCardProps = {
  title: string;
}

const CourseOfferingCard = ({ title } : CourseOfferingCardProps) => {
  return (
    <Card>
      <CardContent>
        <Typography className={styles.heading}>
          {title}
        </Typography>
      </CardContent>
      <CardActions>
        <Button disableElevation className={styles.queueBtn}>QUEUES</Button>
        <Button disableElevation className={styles.analyticsBtn}>ANALYTICS</Button>
        <Button disableElevation className={styles.tutorPageBtn}>TUTOR PAGE</Button>
        <TutorInviteModal />
      </CardActions>
    </Card>
  );
};

export default CourseOfferingCard;
