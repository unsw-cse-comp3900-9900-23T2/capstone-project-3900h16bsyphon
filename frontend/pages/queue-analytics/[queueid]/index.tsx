import { Box, Button, Typography } from '@mui/material';
import Header from '../../../components/Header';
import styles from './QueueAnalytics.module.css';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { authenticatedGetFetch, toCamelCase, getActualDuration } from '../../../utils';


const requests = [
  {
    requestId: 0,
    zid: 5309306,
    firstName: 'Aisha',
    lastName: 'Nauman',
    duration: { hours: 0, minutes: 10, seconds: 23 }
  },
];

const dummyQueueAnalytics = {
  studentsJoined: 10,
  studentsResolved: 7,
  studentsUnresolved: 3,
  requests
};

const QueueAnalytics = () => {
  const router = useRouter();
  const [queueAnalytics, setQueueAnalytics] = useState(dummyQueueAnalytics);

  useEffect(() => {
    const getAnalyticsData = async () => {

    };
    if (!router.query.queueid) return;
    getAnalyticsData();
  }, [router.query.queueid]);
  
  return (
    <>
      <Header />
      <div className={styles.pageContainer}>
        <div className={styles.queueTitle}>
          <Typography variant='h3'>Queue Title</Typography>
        </div>
        <div className={styles.body}>
          <div className={styles.buttonContainer}>
            <Button className={styles.greyButton} variant='contained' onClick={() => router.back()}>Back</Button>
          </div>

          <div className={styles.summaryContainer}>
            {/* time spent per request (include zid and student name) */}
          </div>

          <div className={styles.summaryContainer}>
            {/* number of students entered the queue */}
            {/* number of students served */}
            {/* number of students left for the end of the help session */}
          </div>
        </div>
      </div>
    </>);
};

export default QueueAnalytics;
