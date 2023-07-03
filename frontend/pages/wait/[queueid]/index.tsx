import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
} from '@mui/material';
import styles from './WaitingScreen.module.css';

import { useRouter } from 'next/router';
import StudentRequestCard from '../../../components/StudentRequestCard';
import { authenticatedGetFetch, toCamelCase } from '../../../utils';

const defaultData = {
  zid: 'z5303033',
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
  console.log(router.query.queueid);
  useEffect(() => {
    let getRequest = async () => {
      console.log('GETTING DATA');
      let res = await authenticatedGetFetch('/request/get_info', {request_id: `${router.query.queueid || -1}`});
      console.log('got res');
      console.log(res);
      if (res.status === 404) {
        setReqState('Not Found');
      } else if (res.status === 403) {
        setReqState('Forbidden');
      } else if (res.status === 200) {
        setReqState('Success');
        let d = await res.json();
        console.log(d);
        setData(toCamelCase(d));
      }
    };
    if (!router.query.queueid) {
      return;
    }
    getRequest();
  // TODO add dependency
  }, [router.query.queueid, router.query.id]);

  useEffect(() => {
    console.log('GET request data here');
  }, []);

  if (reqState === 'Not Found') {
    router.push('/404');
  } else if (reqState === 'Forbidden') {
    router.push('/403');
  }

  return (
    <>
      <div className={styles.pageContainer}>
        <div className={styles.queueTitle}>
          <Typography className={styles.text} variant='h2'>
            {requestData.queueTitle}
          </Typography>
        </div>
        <Box className={styles.cardBox}>
          <div className={styles.buttonContainer}>
            <Button className={styles.greenButton} variant='contained' onClick={() => router.push('/dashboard')}>Resolve</Button>
          </div>
          <StudentRequestCard 
            zid={requestData.zid}
            status={requestData.status}
            firstName={requestData.firstName}
            lastName={requestData.lastName}
            tags={requestData.tags}
            title={requestData.title}
            queueId={router.query.queueid as string | undefined}
            description={requestData.description}
          />
        </Box>
      </div>
    </>
  );
};

export default WaitingScreen;
