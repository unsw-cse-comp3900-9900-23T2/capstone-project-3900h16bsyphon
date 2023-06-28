import React, { useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
} from '@mui/material';
import styles from './WaitingScreen.module.css';

import { useRouter } from 'next/router';
import StudentRequestCard from '../../../components/StudentRequestCard';

const requestData = {
  zid: 'z5303033',
  queueTitle: 'COMP1521 Thursday Week 5 Help Session',
  firstName: 'Jane',
  lastName: 'Doe',
  status: 'Unresolved',
  title: 'Pls help me with printing this array - im so stuck!',
  tags: ['Assignment 1', 'Subset 0'],
  previousRequests: 5,
  description:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
};

const WaitingScreen = () => {
  useEffect(() => {
    console.log('GET request data here');
  }, []);

  const router = useRouter();

  return (
    <>
      <div className={styles.pageContainer}>
        <div className={styles.queueTitle}>
          <Typography className={styles.text} variant='h2'>
            {requestData.queueTitle}
          </Typography>
        </div>
        <Box className={styles.cardBox}>
          <div>
            <Button variant='contained' onClick={() => router.push('/dashboard')}>Resolve</Button>
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
    </>
  );
};

export default WaitingScreen;
