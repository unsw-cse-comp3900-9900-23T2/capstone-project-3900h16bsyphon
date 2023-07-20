import styles from './Request.module.css';
import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/router';
import StudentRequestCard from '../../../components/StudentRequestCard';
import Header from '../../../components/Header';
import MetaData from '../../../components/MetaData';
import {
  authenticatedGetFetch,
  authenticatedPutFetch,
  toCamelCase,
} from '../../../utils';
import { Status } from '../../../types/requests';
import TimeSummaryCard from '../../../components/TimeSummaryCard';
import ChatBox from '../../../components/ChatBox';

const Request = () => {
  const router = useRouter();
  const [data, setData] = useState({
    zid: 5303033,
    queueId: 1,
    queueTitle: 'COMP1521 Thursday Week 5 Help Session',
    firstName: 'Jane',
    lastName: 'Doe',
    status: Status.Seeing,
    previousRequests: 1,
    title: 'Pls help me with printing this array - im so stuck!',
    tags: [{ name: 'Assignment 1', tagId: 1, isPriority: false }],
    isClusterable: false,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  });
  const [startTime, setStartTime] = useState(new Date());

  useEffect(() => {
    let getRequest = async () => {
      if (!router.query.requestid) return;
      const res = await authenticatedGetFetch('/request/get_info', {
        request_id: `${router.query.requestid}`,
      });
      let d = await res.json();
      setData(toCamelCase(d));
    };
    let getStartTime = async () => {
      const res = await authenticatedGetFetch('/logs/get_start_time', {
        request_id: `${router.query.requestid}`,
      });
      let d = await res.json();
      setStartTime(toCamelCase(d?.event_time));
    };
    getRequest();
    getStartTime();
  }, [router.query.requestid]);

  const updateStatus = async (status: Status) => {
    const res = await authenticatedPutFetch('/request/set_status', {
      request_id: Number.parseInt(`${router.query.requestid}`),
      status: status,
    });
    if (!res.ok) {
      console.log(
        'error: something went wrong with resolve request; check network tab'
      );
      return;
    }
    setData({...data, status});
    if (status !== Status.Seeing) {
      router.push(`/active-queue/${data.queueId}`);
    }

  };


  return (
    <>
      <MetaData />
      <Header />
      <div className={styles.pageContainer}>
        <div className={styles.queueTitle}>
          <Typography variant="h2">{data.queueTitle}</Typography>
        </div>
        <div className={styles.body}>
          {/* TODO: fix the colours */}
          <div className={styles.buttonContainer}>
            {data.status === Status.Seeing && (
              <Button
                className={styles.greenButton}
                variant="contained"
                onClick={() => updateStatus(Status.Seen)}
              >
                Resolve
              </Button>
            )}
            {data.status === Status.Unseen && (
              <>
                <Button
                  className={styles.greenButton}
                  variant="contained"
                  onClick={() => updateStatus(Status.Seeing)}
                >
                  Claim
                </Button>
                <Button
                  className={styles.redButton}
                  variant="contained"
                  onClick={() => updateStatus(Status.NotFound)}
                >
                  Not Found
                </Button>
                <Button
                  className={styles.greyButton}
                  variant="contained"
                  onClick={() => router.back()}
                >
                  Back
                </Button>
              </>
            )}
            {data.status === Status.Seen && (
              <Button
                className={styles.greenButton}
                variant="contained"
                onClick={() => updateStatus(Status.Unseen)}
              >
                Unresolve
              </Button>
            )}
            {data.status === Status.NotFound && (
              <>
                <Button
                  className={styles.greenButton}
                  variant="contained"
                  onClick={() => updateStatus(Status.Seeing)}
                >
                  Claim
                </Button>
                <Button
                  className={styles.greenButton}
                  variant="contained"
                  onClick={() => updateStatus(Status.Seen)}
                >
                  Resolve
                </Button>
              </>
            )}
            <TimeSummaryCard startTime={startTime} status={data.status}/>
          </div>
          <Box className={styles.cardBox}>
            <StudentRequestCard
              zid={data.zid}
              status={data.status}
              firstName={data.firstName}
              lastName={data.lastName}
              tags={data.tags}
              title={data.title}
              previousRequests={data.previousRequests}
              description={data.description}
            />
          </Box>
          <div className={styles.chatContainer}>
            <ChatBox requestId={Number.parseInt(`${router.query.requestid}`)} isStudent={false} studentZid={data.zid}/> 
          </div>
        </div>
      </div>
    </>
  );
};

export default Request;

