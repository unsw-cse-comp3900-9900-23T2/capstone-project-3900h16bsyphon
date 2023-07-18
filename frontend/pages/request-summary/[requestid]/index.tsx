import { Box, Button, Card, Typography } from '@mui/material';
import Header from '../../../components/Header';
import styles from './RequestSummary.module.css';
import StudentRequestCard from '../../../components/StudentRequestCard';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { authenticatedGetFetch, toCamelCase } from '../../../utils';
import { Status, UserRequestSummary } from '../../../types/requests';

const RequestSummary = () => {
  const router = useRouter();
  const [requestData, setData] = useState({
    zid: 5303033,
    queueTitle: 'COMP1521 Thursday Week 5 Help Session',
    firstName: 'Jane',
    lastName: 'Doe',
    status: Status.Unseen,
    title: 'Pls help me with printing this array - im so stuck!',
    queueId: 1,
    courseOfferingId: 1,
    tags: [{
      name: 'tag',
      isPriority: false,
      tagId: 1,
    }],
    isClusterable: false,
    previousRequests: 5,
    description:''  
  });

  const [requestSummary, setRequestSummary] = useState<UserRequestSummary>({
    tutors: [],
    startTime: { eventTime: ''},
    endTime: { eventTime: ''},
  });
  
  useEffect(() => {
    const getRequest = async () => {
      const res = await authenticatedGetFetch('/request/get_info', {request_id: `${router.query.requestid}`});
      if (res.status === 404) {
        router.push('/404');
      } else if (res.status === 403) {
        router.push('/403');
      } else if (res.status === 200) {
        const d = await res.json();
        setData(toCamelCase(d));
      }
    };
    const getRequestSummary = async () => {
      const res = await authenticatedGetFetch('/request/summary', {request_id: `${router.query.requestid}`});
      if (!res.ok) {
        console.log('something failed with getting request summary, check network tab');
        return;
      } 
      const d = await res.json();
      setRequestSummary(toCamelCase(d));
      console.log('the request summary data is: ', requestSummary);
      
    };
    if (!router.query.requestid) return;
    getRequest();
    getRequestSummary();
  }, [router.query.requestid, router]);

  return (
    <>
      <Header />
      <div className={styles.pageContainer}>
        <div className={styles.queueTitle}>
          <Typography variant='h3'>
            {requestData.queueTitle}
          </Typography>
        </div>
        <div className={styles.body}>
          <div className={styles.buttonContainer}>
            <Button className={styles.greyButton} variant='contained' onClick={() => router.push('/dashboard')}>Exit</Button>
          </div>
          <Box className={styles.cardBox}>
            <StudentRequestCard
              zid={requestData.zid}
              status={requestData.status}
              firstName={requestData.firstName}
              lastName={requestData.lastName}
              tags={requestData.tags}
              title={requestData.title}
              previousRequests={requestData.previousRequests}
              description={requestData.description}
            />
          </Box>
          <div className={styles.summaryContainer}>
            {/* time summary in this div */}
            <Card>

            </Card>
            <Card>

            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestSummary;
