import styles from './Request.module.css';
import React, { useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
} from '@mui/material';

import { useRouter } from 'next/router';
import StudentRequestCard from '../../../components/StudentRequestCard';
import Header from '../../../components/Header';
import MetaData from '../../../components/MetaData';

type RequestProps = {
  requestId: number,
}

const Request = ({ requestId }: RequestProps) => {
  const router = useRouter();

  const requestData = {
    zid: 'z5303033',
    queueId: 1,
    queueTitle: 'COMP1521 Thursday Week 5 Help Session',
    firstName: 'Jane',
    lastName: 'Doe',
    status: 'In Progress',
    title: 'Pls help me with printing this array - im so stuck!',
    tags: ['Assignment 1', 'Subset 0'],
    previousRequests: 5,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  };

  useEffect(() => {
    // TOOD: BE GET request to populate the student request card component
    console.log('GET from Request page with requestId ' + requestId);
    
  }, [requestId]);

  return <>
    <MetaData />
    <Header />
    <div className={styles.pageContainer}>
      <div className={styles.queueTitle}>
        <Typography className={styles.text} variant='h2'>
          {requestData.queueTitle}
        </Typography>
      </div>
      <Box className={styles.cardBox}>
        <div className={styles.buttonContainer}>
          <Button className={styles.greenButton} variant='contained' onClick={() => router.push(`/active-queue/${requestData.queueId}`)}>Resolve</Button>
          <Button className={styles.redButton} variant='contained' onClick={() => router.push(`/active-queue/${requestData.queueId}`)}>Not Found</Button>
        </div>
        <StudentRequestCard 
          zid={requestData.zid}
          status={requestData.status}
          firstName={requestData.firstName}
          lastName={requestData.lastName}
          tags={requestData.tags}
          title={requestData.title}
          previousRequests={requestData.previousRequests}
          description={requestData.description}
        />
      </Box>
    </div>
  </>;
};

export default Request;
