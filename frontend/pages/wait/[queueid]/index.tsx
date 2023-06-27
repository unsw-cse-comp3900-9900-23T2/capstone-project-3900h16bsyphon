import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Typography, 
  Button, 
  Select, 
  MenuItem, 
  OutlinedInput, 
  SelectChangeEvent, 
  FormControlLabel, 
  Checkbox
} from '@mui/material';
import styles from './WaitingScreen.module.css';

import { useRouter } from 'next/router';
import TagBox from '../../../components/TagBox';

const requestData = {
  zid: 'z5303033',
  queueTitle: 'COMP1521 Thursday Week 5 Help Session',
  firstName: 'Jane',
  lastName: 'Doe',
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
          <Card className={styles.cardContainer}>
            <CardContent className={styles.cardContent}>
              <div className={styles.cardHeader}>
                {/* this is student name/zid/prev req div */}
                <div className={styles.zidNameContainer}>
                  <div>
                    <TagBox text={requestData.zid} backgroundColor='#D5CFFF' color='#3E368F' />
                  </div>
                  <div>
                    <Typography className={styles.textHeading} variant='h6'>
                      {requestData.firstName + ' ' + requestData.lastName}
                    </Typography>
                  </div>
                </div>
                <div className={styles.previousRequestsContainer}>
                  {/* number of previous requests component here */}
                  <TagBox text={'PREVIOUS TOTAL REQUESTS: ' + requestData.previousRequests} backgroundColor='#D5CFFF' color='#3E368F' />
                </div>
              </div>
              <div>
                {/* request title div */}
                <Typography className={styles.textHeading} variant='h6'>
                  {requestData.title}
                </Typography>
              </div>
              <div className={styles.tagContainer}>
                {requestData.tags.map((tag, i) => {
                  return <TagBox text={tag} key={i} backgroundColor='#EDB549' color='white' />;
                })}
              </div>

              <div>
                <Typography className={styles.text} variant='body1'>
                  {requestData.description}
                </Typography>
              </div>
            </CardContent>
          </Card>
        </Box>
      </div>
    </>
  );
};

export default WaitingScreen;
