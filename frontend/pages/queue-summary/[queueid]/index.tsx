import { Box, Button, Duration, Typography } from '@mui/material';
import Header from '../../../components/Header';
import styles from './QueueSummary.module.css';
import StudentRequestCard from '../../../components/StudentRequestCard';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { authenticatedGetFetch, toCamelCase } from '../../../utils';
import { Status, Tag } from '../../../types/requests';

const QueueSummary = () => {
  const router = useRouter();
  
  useEffect(() => {
    let getRequest = async () => {
      let res = await authenticatedGetFetch('/request/get_info', {request_id: `${router.query.requestid}`});

    };
    if (!router.query.requestid) return;
    getRequest();
  }, [router.query.queueid]);

  return (
    <>
      <Header />
      <div className={styles.pageContainer}>
        <div className={styles.queueTitle}>
          <Typography variant='h3'>
            {/* {requestData.queueTitle} */}
          </Typography>
        </div>
        <div className={styles.body}>
          <div className={styles.buttonContainer}>
            <Button className={styles.greyButton} variant='contained' onClick={() => router.push('/dashboard')}>Exit</Button>
          </div>

          <div className={styles.summaryContainer}>
            {/* time summary in this div */}
          </div>
        </div>
      </div>
    </>
  );
};

export default QueueSummary;
