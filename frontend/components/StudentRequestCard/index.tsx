import React, { useEffect, useState } from 'react';
import {  
  Card, 
  CardContent, 
  Typography, 
} from '@mui/material';
import styles from './StudentRequestCard.module.css';
import TagBox from '../TagBox';
import { authenticatedGetFetch, formatZid } from '../../utils';

type StudentRequestCardProps = {
  zid: number,
  firstName: string,
  lastName: string,
  title: string,
  tags: string[],
  status: string,
  description: string,
  queueId: number,
}

const StudentRequestCard = ({ zid, firstName, lastName, title, description, tags, status, queueId }: StudentRequestCardProps) => {
  const [previousRequests, setPreviousRequests] = useState(0);
  useEffect(() => {
    const findRequests = async () => {
      const res = await authenticatedGetFetch('/history/request_count', {
        zid: zid.toString(),
        queue_id: queueId.toString()
      });
      const value = await res.json();
      setPreviousRequests(value.count);
    };
    findRequests();
  }, [queueId, zid]);

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
            <TagBox text={formatZid(zid)} backgroundColor='#D5CFFF' color='#3E368F' />
          </div>
          <div>
            <Typography className={styles.textHeading} variant='h6'>
              {firstName + ' ' + lastName}
            </Typography>
          </div>
        </div>
        <div className={styles.previousRequestsContainer}>
          <TagBox text={`PREVIOUS TOTAL REQUESTS: ${previousRequests - 1}`} backgroundColor='#D5CFFF' color='#3E368F' />
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
