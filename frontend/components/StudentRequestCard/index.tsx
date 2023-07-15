import React, { useEffect, useState } from 'react';
import {  
  Card, 
  CardContent, 
  Typography, 
} from '@mui/material';
import styles from './StudentRequestCard.module.css';
import TagBox from '../TagBox';
import { authenticatedGetFetch, formatZid } from '../../utils';
import { Status, Tag } from '../../types/requests';

type StudentRequestCardProps = {
  zid: number,
  firstName: string,
  lastName: string,
  title: string,
  tags: Tag[],
  status: Status,
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

  const determineBackgroundColour = (status: Status) => {
    // TOOD: standardize these request status 
    switch (status) {
    case Status.Seen:
      return '#EDFFEE';
    case Status.Unseen:
      return 'white';
    case Status.Seeing:
      return '#E3F0FC';
    case Status.NotFound:
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
          <TagBox text={`PREVIOUS TOTAL REQUESTS: ${previousRequests}`} backgroundColor='#D5CFFF' color='#3E368F' />
        </div>
      </div>
      <div>
        <Typography className={styles.textHeading} variant='h6'>
          {title}
        </Typography>
      </div>
      <div className={styles.tagContainer}>
        {tags?.map((tag, i) => {
          return <TagBox text={tag.name} key={i} isPriority={tag.isPriority} backgroundColor='#EDB549' color='white' />;
        })}
      </div>
      <div>
        <Typography variant='body1'>
          {description}
        </Typography>
      </div>
    </CardContent>
  </Card>;
};

export default StudentRequestCard;
