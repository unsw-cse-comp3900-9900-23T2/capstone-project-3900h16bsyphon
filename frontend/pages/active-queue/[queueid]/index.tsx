import { Box, Button, Typography } from '@mui/material';
import styles from './ActiveQueue.module.css';
import { useRouter } from 'next/router';
import StudentQueueRequestCard from '../../../components/StudentQueueRequestCard';
import MetaData from '../../../components/MetaData';
import Header from '../../../components/Header';

const requests = [
  {
    zid: 'z5303033',
    requestId: 0,
    firstName: 'Jane',
    lastName: 'Doe',
    title: 'Pls help me with printing this array - im so stuck!',
    tags: ['Assignment 1', 'Subset 0'],
    previousRequests: 5,
    status: 'Resolved',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  },
  {
    zid: 'z5303033',
    requestId: 1,
    firstName: 'Jane',
    lastName: 'Doe',
    title: 'Pls help me with printing this array - im so stuck!',
    tags: ['Assignment 1', 'Subset 0'],
    previousRequests: 5,
    status: 'Unresolved',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  },
  {
    zid: 'z5303033',
    requestId: 2,
    firstName: 'Jane',
    lastName: 'Doe',
    title: 'Pls help me with printing this array - im so stuck! This is a longer title',
    tags: ['Assignment 1', 'Subset 0'],
    previousRequests: 5,
    status: 'In Progress',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  },
];

const requestData = {
  queueTitle: 'COMP1521 Thursday Week 5 Help Session',
  queueId: 1,
  courseId: 1,
  requests
};

const ActiveQueue = () => {
  const router = useRouter();
  
  return <>
    <MetaData />
    <Header />
    <div className={styles.pageContainer}>
      <div className={styles.queueTitle}>
        <Typography className={styles.text} variant='h2'>
          {requestData.queueTitle}
        </Typography>
      </div>
      <Box className={styles.cardBox}>
        <div className={styles.buttonContainer}>
          <Button className={styles.closeQueueButton} variant='contained' onClick={() => router.push(`/queue/${requestData.courseId}`)}>Close Queue</Button>
        </div>
        <div className={styles.requestCardContainer}>
          {/* list of student cards here */}
          {requestData.requests.map((request) => {
            return <StudentQueueRequestCard 
              key={request.requestId}  
              requestId={request.requestId}  
              zid={request.zid}
              firstName={request.firstName}
              lastName={request.lastName}
              tags={request.tags}
              title={request.title}
              status={request.status}
              previousRequests={request.previousRequests}
            />;
          })}
        </div>
      </Box>
    </div>
  </>;
};

export default ActiveQueue;
