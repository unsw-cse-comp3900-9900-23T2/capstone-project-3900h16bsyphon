import { Box, Button, Typography } from '@mui/material';
import styles from './ActiveQueue.module.css';
import { useRouter } from 'next/router';


const requests = [
  {
    zid: 'z5303033',
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
    firstName: 'Jane',
    lastName: 'Doe',
    title: 'Pls help me with printing this array - im so stuck!',
    tags: ['Assignment 1', 'Subset 0'],
    previousRequests: 5,
    status: 'Claimed',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  },
];

const requestData = {
  queueTitle: 'COMP1521 Thursday Week 5 Help Session',
  requests
};



const ActiveQueue = () => {
  const router = useRouter();
  
  return <>
    <div className={styles.pageContainer}>
      <div className={styles.queueTitle}>
        <Typography className={styles.text} variant='h2'>
          Queue Title
        </Typography>
      </div>
      <Box className={styles.cardBox}>
        <div>
          <Button variant='contained' onClick={() => router.push('/dashboard')}>Resolve</Button>
        </div>
        <div>
          {/* list of student cards here */}
          {/* {requestData.requests.map((request, i) => {

          })} */}
        </div>
      </Box>
    </div>
  </>;
};

export default ActiveQueue;
