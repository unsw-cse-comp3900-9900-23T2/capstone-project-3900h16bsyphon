import { Box, Button, Typography } from '@mui/material';
import Header from '../../../components/Header';
import styles from './QueueSummary.module.css';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { authenticatedGetFetch, toCamelCase } from '../../../utils';
import { Status, Tag } from '../../../types/requests';
import { QueueSummaryData } from '../../../types/queues';
import OverallTimeSummary from '../../../components/OverallTimeSummary';

const tags = [
  {
    tagId: 0,
    name: 'ass',
    isPriority: false
  },
  {
    tagId: 1,
    name: 'lab',
    isPriority: false
  }
];

const tutorSummary = [
  {
    zid: 5309306,
    firstName: 'aisha',
    lastName: 'nauman',
    totalSeen: 1,
    totalSeeing: 2,
    averageTime: 20,
    tagsWorkedOn: tags
  }
];

const tagSummary = [
  {
    tag: tags[0],
    duration: { hours: 0, minutes: 20, seconds: 5 }
  },
  {
    tag: tags[1],
    duration: { hours: 0, minutes: 54, seconds: 6 }
  }
];

const queueSummaryInitialValue: QueueSummaryData = {
  title: 'This is a test title',
  courseCode: 'COMP1111',
  startTime: { eventTime: new Date().toISOString() as unknown as Date},
  endTime: { eventTime: new Date().toISOString() as unknown as Date},
  duration: { hours: 1, minutes: 54, seconds: 6 },
  tutorSummaries: tutorSummary,
  tagSummaries: tagSummary,
};

const QueueSummary = () => {
  const router = useRouter();
  const [summaryData, setSummaryData] = useState<QueueSummaryData>(queueSummaryInitialValue);
  
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
          <Typography variant='h3'>{summaryData.courseCode + ': ' + summaryData.title}</Typography>
        </div>
        <div className={styles.body}>
          <div className={styles.buttonContainer}>
            <Button className={styles.greyButton} variant='contained' onClick={() => router.push('/dashboard')}>Dashboard</Button>
          </div>

          <div className={styles.summaryContainer}>
            <OverallTimeSummary 
              startTime={summaryData.startTime}
              endTime={summaryData.endTime} 
              duration={summaryData.duration}
              backgroundColor='var(--colour-main-red-200)'
              textColor='var(--colour-main-red-900)'
            />
            {/* tutor summaries in this div too */}

          </div>
          <div className={styles.summaryContainer}>
            {/* tag summaries in this div */}
          </div>
        </div>
      </div>
    </>
  );
};

export default QueueSummary;
