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

const requestData = {
  zid: 'z5303033',
  queueTitle: 'COMP1521 Thursday Week 5 Help Session',
  firstName: 'Jane',
  lastName: 'Doe',
  title: 'Pls help me with printing this array - im so stuck!',
  tags: ['Assignment 1', 'Subset 0'],
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
        <div className={styles.cardHeader}>
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
              <div>
                {/* this is student name/zid/prev req div */}
                <div>
                  <div>
                    {/* zid */}
                  </div>
                  <div>
                    <Typography className={styles.text} variant='h6'>
                      {requestData.firstName + ' ' + requestData.lastName}
                    </Typography>
                  </div>
                </div>
                <div>
                  {/* number of previous requests component here */}
                </div>
              </div>
              <div>
                {/* request title div */}
                <Typography className={styles.text} variant='h6'>
                  {requestData.title}
                </Typography>
              </div>
              <div>
                {/* tags div */}
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
