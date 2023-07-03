import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
} from '@mui/material';
import styles from './WaitingScreen.module.css';

import { useRouter } from 'next/router';
import StudentRequestCard from '../../../components/StudentRequestCard';
import { authenticatedGetFetch, formatZid, toCamelCase } from '../../../utils';
import Header from '../../../components/Header';

const defaultData  = {
  zid: 5303033,
  queueTitle: 'COMP1521 Thursday Week 5 Help Session',
  firstName: 'Jane',
  lastName: 'Doe',
  status: 'Unresolved',
  title: 'Pls help me with printing this array - im so stuck!',
  tags: ['Assignment 1', 'Subset 0'],
  isClusterable: false,
  previousRequests: 5,
  description:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
};

const WaitingScreen = () => {
  const router = useRouter();
  const [requestData, setData] = useState(defaultData);
  const  [reqState, setReqState] = useState('Unresolved');
  console.log(router.query.requestid);
  useEffect(() => {
    let getRequest = async () => {
      let res = await authenticatedGetFetch('/request/get_info', {request_id: `${router.query.requestid}`});
      console.log('got res');
      console.log(res);
      if (res.status === 404) {
        setReqState('Not Found');
      } else if (res.status === 403) {
        setReqState('Forbidden');
      } else if (res.status === 200) {
        setReqState('Success');
        let d = await res.json();
        setData(toCamelCase(d));
      }
    };
    if (!router.query.requestid) {
      return;
    }
    getRequest();
  }, [router.query.requestid]);

  if (reqState === 'Not Found') {
    router.push('/404');
  } else if (reqState === 'Forbidden') {
    router.push('/403');
  }

  return (
    <> 
      <Header />
      <div className={styles.pageContainer}>
        <div className={styles.queueTitle}>
          <Typography className={styles.text} variant='h3'>
            {requestData.queueTitle}
          </Typography>
        </div>
        <Box className={styles.cardBox}>
          <div className={styles.buttonContainer}>
            <Button className={styles.greenButton} variant='contained' onClick={() => router.push('/dashboard')}>Resolve</Button>
          </div>
          <StudentRequestCard 
            zid={formatZid(requestData.zid)}
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
