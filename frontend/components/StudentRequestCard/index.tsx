import React from 'react';
import {  
  Card, 
  CardContent, 
  Typography, 
} from '@mui/material';
import styles from './StudentRequestCard.module.css';
import TagBox from '../TagBox';

type StudentRequestCardProps = {
  zid: string,
  firstName: string,
  lastName: string,
  title: string,
  tags: string[],
  status: string,
  previousRequests: number,
  description: string,
}

const StudentRequestCard = ({ zid, firstName, lastName, title, description, previousRequests, tags, status }: StudentRequestCardProps) => {

  const determineBackgroundColour = (status: string) => {
    // TOOD: standardize these request status 
    switch (status) {
    case 'Resolved':
      return '#EDFFEE';
    case 'Unresolved':
      return 'white';
    case 'In Progress':
      return '#E3F0FC';
    case 'Not Found':
      return '#F8E9E9';
    default:
      return 'white';
    }
  };

  const backgroundColor = determineBackgroundColour(status);


  return <Card style={{ backgroundColor }} className={styles.cardContainer}>
    <CardContent className={styles.cardContent}>
      <div className={styles.cardHeader}>
        <div className={styles.zidNameContainer}>
          <div>
            <TagBox text={zid} backgroundColor='#D5CFFF' color='#3E368F' />
          </div>
          <div>
            <Typography className={styles.textHeading} variant='h6'>
              {firstName + ' ' + lastName}
            </Typography>
          </div>
        </div>
        <div className={styles.previousRequestsContainer}>
          <TagBox text={'PREVIOUS TOTAL REQUESTS: ' + previousRequests} backgroundColor='#D5CFFF' color='#3E368F' />
        </div>
      </div>
      <div>
        <Typography className={styles.textHeading} variant='h6'>
          {title}
        </Typography>
      </div>
      <div className={styles.tagContainer}>
        {tags?.map((tag, i) => {
          return <TagBox text={tag} key={i} backgroundColor='#EDB549' color='white' />;
        })}
      </div>
      <div>
        <Typography className={styles.text} variant='body1'>
          {description}
        </Typography>
      </div>
    </CardContent>
  </Card>;
};

export default StudentRequestCard;
