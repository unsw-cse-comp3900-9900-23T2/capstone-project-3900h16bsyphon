import styles from './Request.module.css';
import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
} from '@mui/material';
import { useRouter } from 'next/router';
import StudentRequestCard from '../../../components/StudentRequestCard';
import Header from '../../../components/Header';
import MetaData from '../../../components/MetaData';
import { authenticatedGetFetch, authenticatedPutFetch, toCamelCase } from '../../../utils';
import TagBox from '../../../components/TagBox';

const Request = () => {
  const router = useRouter();
  const [data, setData] = useState({
    zid: 5303033,
    queueId: 1,
    queueTitle: 'COMP1521 Thursday Week 5 Help Session',
    firstName: 'Jane',
    lastName: 'Doe',
    status: 'In Progress',
    title: 'Pls help me with printing this array - im so stuck!',
    tags: ['Assignment 1', 'Subset 0'],
    isClusterable: false,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  });

  const disableCluster = async () => {
    const res = await authenticatedPutFetch('/request/disable_cluster', {
      request_id: Number.parseInt(`${router.query.requestid}`)
    });
    if (!res.ok) {
      console.log('error');
      return;
    }
    router.reload();
    return;
  };

  useEffect(() => {
    let getRequest = async() => {
      if (!router.query.requestid) return;
      const res = await authenticatedGetFetch('/request/get_info', {
        request_id: `${router.query.requestid}`,
      });
      let d = await res.json();
      setData(toCamelCase(d));
    };
    getRequest();
  }, [router.query.requestid]);

  return <>
    <MetaData />
    <Header />
    <div className={styles.pageContainer}>
      <div className={styles.queueTitle}>
        <Typography className={styles.text} variant='h2'>
          {data.queueTitle}
        </Typography>
      </div>
      {data.isClusterable ? (
        <div className={styles.clusterContainer}>
          <TagBox
            text="You have been added to a cluster by the tutor! You question will be answered as a group. Click the button to remove yourself"
            backgroundColor="var(--colour-main-orange-200)"
            color="var(--colour-main-orange-900)"
          />
          <Button className={styles.removeBtn} onClick={disableCluster}>Remove</Button>
        </div>
      ) : null}
      <Box className={styles.cardBox}>
        <div className={styles.buttonContainer}>
          <Button className={styles.greenButton} variant='contained' onClick={() => router.push(`/active-queue/${data.queueId}`)}>Resolve</Button>
          <Button className={styles.redButton} variant='contained' onClick={() => router.push(`/active-queue/${data.queueId}`)}>Not Found</Button>
        </div>
        <div className={styles.cardContainer}>
          <StudentRequestCard 
            zid={data.zid}
            status={data.status}
            firstName={data.firstName}
            lastName={data.lastName}
            tags={data.tags}
            title={data.title}
            queueId={data.queueId}
            description={data.description}
          />
        </div>
      </Box>
    </div>
  </>;
};

export default Request;
