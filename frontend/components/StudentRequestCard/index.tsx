import React, { useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
} from '@mui/material';
import styles from './StudentRequestCard.module.css';

import { useRouter } from 'next/router';
import TagBox from '../TagBox';

interface StudentRequestCardProps {
  zid: string,
  firstName: string,
  lastName: string,
  title: string,
  tags: string[],
  previousRequests: number,
  description: string,
}

const StudentRequestCard = ({ zid, firstName, lastName, title, description, previousRequests, tags}: StudentRequestCardProps) => {

  return <Card className={styles.cardContainer}>
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
        {tags.map((tag, i) => {
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
