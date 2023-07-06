import { Box, Button, Typography } from '@mui/material';
import styles from './ActiveQueue.module.css';
import { useRouter } from 'next/router';
import StudentQueueRequestCard from '../../../components/StudentQueueRequestCard';
import MetaData from '../../../components/MetaData';
import Header from '../../../components/Header';
import { useEffect, useState } from 'react';
import { authenticatedGetFetch, toCamelCase } from '../../../utils';
import { UserRequest } from '../../../types/requests';

const ActiveQueue = () => {
  const router = useRouter();
  
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [requestData, setRequestData] = useState({
    queueTitle: 'COMP1521 Thursday Week 5 Help Session',
    queueId: 1,
    courseOfferingId: 1,
    requests,
  });

  useEffect(() => {
    let getRequests = async () => {
      let res = await authenticatedGetFetch('/request/all_requests_for_queue', {queue_id: `${router.query.queueid}`});
      // yolo assume OK
      let d = await res.json();
      setRequests(toCamelCase(d));
    };
    let getQueueData = async () => {
      let res = await authenticatedGetFetch('/queue/get', {queue_id: `${router.query.queueid}`});
      let d = await res.json();
      setRequestData(toCamelCase(d));
    };
    if (!router.query.queueid) return;
    getRequests();
    getQueueData();
  }, [router.query.queueid]);
  
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
        <div className={styles.requestCardContainer}>
          {requests && requests.length !== 0 ? (
            requests.map((request) => (
              <StudentQueueRequestCard
                key={request.requestId}
                requestId={request.requestId}
                zid={request.zid}
                firstName={request.firstName}
                lastName={request.lastName}
                tags={request.tags.map((tag) => tag.name)}
                title={request.title}
                status={request.status}
                queueId={router.query.queueid as string | undefined}
              />
            ))
          ) : (
            <div> There are no requests </div>
          )}
        </div>
        <div className={styles.buttonContainer}>
          <Button className={styles.closeQueueButton} variant='contained' onClick={() => router.push(`/course/${requestData.courseOfferingId}`)}>Close Queue</Button>
        </div>
      </Box>
    </div>
  </>;
};

export default ActiveQueue;
