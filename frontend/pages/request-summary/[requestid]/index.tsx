import { Box, Button, Typography } from '@mui/material';
import Header from '../../../components/Header';
import styles from './RequestSummary.module.css';
import StudentRequestCard from '../../../components/StudentRequestCard';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { authenticatedGetFetch, toCamelCase } from '../../../utils';
import { Status } from '../../../types/requests';

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
  
  useEffect(() => {
    let getRequest = async () => {
      let res = await authenticatedGetFetch('/request/get_info', {request_id: `${router.query.requestid}`});
      if (res.status === 404) {
        router.push('/404');
      } else if (res.status === 403) {
        router.push('/403');
      } else if (res.status === 200) {
        let d = await res.json();
        setData(toCamelCase(d));
      }
    };
    if (!router.query.requestid) return;
    getRequest();
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
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestSummary;
