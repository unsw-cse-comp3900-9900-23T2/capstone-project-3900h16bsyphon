import { Button, Typography } from '@mui/material';
import Header from '../../../components/Header';
import styles from './QueueAnalytics.module.css';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { authenticatedGetFetch, toCamelCase } from '../../../utils';
import { QueueAnalyticsData, QueueRequestSummaryData } from '../../../types/queues';
import QueueRequestsSummaryCard from '../../../components/QueueRequestsSummaryCard';
import QueueAnalyticsSummaryCard from '../../../components/QueueAnalyticsSummaryCard';
import Error from '../../../pages/_error';

const requests: QueueRequestSummaryData[] = [
  {
    requestId: 99,
    zid: 5309306,
    firstName: 'Aisha',
    lastName: 'Nauman',
    isSelfResolved: false,
    duration: { hours: 0, minutes: 10, seconds: 23 }
  },
  {
    requestId: 9999,
    zid: 5309306,
    firstName: 'Aisha',
    lastName: 'Nauman',
    isSelfResolved: true,
    duration: { hours: 0, minutes: 10, seconds: 23 }
  },
  {
    requestId: 999,
    zid: 5309306,
    firstName: 'Aisha',
    lastName: 'Nauman',
    isSelfResolved: false,
    duration: { hours: 0, minutes: 10, seconds: 23 }
  },
];

const dummyQueueAnalytics: QueueAnalyticsData = {
  courseCode: 'COMP1000',
  title: 'this is the title of a queue',
  studentsJoined: 10,
  studentsResolved: 7,
  studentsUnresolved: 3,
  requests
};

const QueueAnalytics = () => {
  const router = useRouter();
  const [queueAnalytics, setQueueAnalytics] = useState<QueueAnalyticsData>(dummyQueueAnalytics);

  useEffect(() => {
    const getAnalyticsData = async () => {
      const res = await authenticatedGetFetch('/queue/analytics', { queue_id: `${router.query.queueid}`});
      if (!res.ok) {
        console.log('error: issue with queue analytics, check network tab');
        return <Error statusCode={res.status} />;
      }
      const d = await res.json();
      setQueueAnalytics(toCamelCase(d));
    };
    if (!router.query.queueid) return;
    getAnalyticsData();
  }, [router.query.queueid]);
  
  return (
    <>
      <Header />
      <div className={styles.pageContainer}>
        <div className={styles.queueTitle}>
          <Typography variant='h3'>{queueAnalytics.courseCode + ': ' + queueAnalytics.title}</Typography>
        </div>
        <div className={styles.body}>
          <div className={styles.buttonContainer}>
            <Button className={styles.greyButton} variant='contained' onClick={() => router.back()}>Back</Button>
          </div>
          <div className={styles.summaryContainer}>
            <QueueRequestsSummaryCard 
              requests={queueAnalytics.requests}            
            />
          </div>

          <div className={styles.summaryContainer}>
            <QueueAnalyticsSummaryCard 
              studentsJoined={queueAnalytics.studentsJoined} 
              studentsResolved={queueAnalytics.studentsResolved} 
              studentsUnresolved={queueAnalytics.studentsUnresolved}
            />
          </div>
        </div>
      </div>
    </>);
};

export default QueueAnalytics;
