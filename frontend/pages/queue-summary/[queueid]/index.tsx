import { Button, Typography } from '@mui/material';
import Header from '../../../components/Header';
import styles from './QueueSummary.module.css';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { authenticatedGetFetch, toCamelCase, getActualDuration } from '../../../utils';
import { QueueAnalyticsData, QueueRequestSummaryData, QueueSummaryData } from '../../../types/queues';
import OverallTimeSummary from '../../../components/OverallTimeSummary';
import QueueTutorSummaryCard from '../../../components/QueueTutorSummaryCard';
import QueueTagSummaryCard from '../../../components/QueueTagSummaryCard';
import QueueRequestsSummaryCard from '../../../components/QueueRequestsSummaryCard';
import QueueAnalyticsSummaryCard from '../../../components/QueueAnalyticsSummaryCard';
import Error from '../../../pages/_error';

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
  startTime: { eventTime: '2023-07-19T11:54:11' as unknown as Date},
  endTime: { eventTime: '2023-07-19T11:54:11' as unknown as Date},
  duration: { hours: 1, minutes: 54, seconds: 6 },
  tutorSummaries: tutorSummary,
  tagSummaries: tagSummary,
};

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

const QueueSummary = () => {
  const router = useRouter();
  const [summaryData, setSummaryData] = useState<QueueSummaryData>(queueSummaryInitialValue);
  const [queueAnalytics, setQueueAnalytics] = useState<QueueAnalyticsData>(dummyQueueAnalytics);
  
  useEffect(() => {
    const getQueueSummary = async () => {
      console.log('getting queue summary . . .');
      const res = await authenticatedGetFetch('/queue/summary', {queue_id: `${router.query.queueid}`});
      if (!res.ok) {
        console.log('something went wrong with queue summary, see network tab');
        return <Error statusCode={res.status} />;
      }
      const data = await res.json();
      setSummaryData(toCamelCase(data));
      console.log('the data inside queue summary is ', data);
    };
    const getAnalyticsData = async () => {
      const res = await authenticatedGetFetch('/queue/analytics', { queue_id: `${router.query.queueid}`});
      if (!res.ok) {
        console.log('error: issue with queue analytics inside queue summary, check network tab');
        return;
      }
      const d = await res.json();
      setQueueAnalytics(toCamelCase(d));
    };
    if (!router.query.queueid) return;
    getQueueSummary();
    getAnalyticsData();
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
              duration={getActualDuration(summaryData.duration)}
              backgroundColor='var(--colour-main-red-200)'
              textColor='var(--colour-main-red-900)'
            />
            {summaryData.tutorSummaries.map((tutorSummary) => {
              return <QueueTutorSummaryCard 
                key={tutorSummary.zid}
                zid={tutorSummary.zid} 
                firstName={tutorSummary.firstName} 
                lastName={tutorSummary.lastName} 
                totalSeen={tutorSummary.totalSeen} 
                totalSeeing={tutorSummary.totalSeeing} 
                averageTime={tutorSummary.averageTime} 
                tagsWorkedOn={tutorSummary.tagsWorkedOn} 
              />;
            })}
          </div>
          <div className={styles.summaryContainer}>
            {/* tag summaries in this div */}
            <QueueAnalyticsSummaryCard 
              studentsJoined={queueAnalytics.studentsJoined} 
              studentsResolved={queueAnalytics.studentsResolved} 
              studentsUnresolved={queueAnalytics.studentsUnresolved}
            />
            <QueueTagSummaryCard tagSummaries={summaryData.tagSummaries} />
            <QueueRequestsSummaryCard 
              requests={queueAnalytics.requests}            
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default QueueSummary;
