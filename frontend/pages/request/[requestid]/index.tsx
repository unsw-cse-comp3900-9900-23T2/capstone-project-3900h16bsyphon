import styles from './Request.module.css';
import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { useRouter } from 'next/router';
import Header from '../../../components/Header';
import MetaData from '../../../components/MetaData';
import {
  authenticatedGetFetch,
  authenticatedPutFetch,
  toCamelCase,
} from '../../../utils';
import { Status } from '../../../types/requests';
import TimeSummaryCard from '../../../components/TimeSummaryCard';
import RequestDetails from '../../../components/RequestDetails';
import Error from '../../../pages/_error';

const Request = () => {
  const router = useRouter();
  const [status, setStatus] = useState(Status.Seeing);
  const [startTime, setStartTime] = useState(new Date());
  const [queueData, setQueueData] = useState({
    queueId: 1,
    status: Status.Seeing,
    title: 'COMP1521 Thursday Week 5 Help Session',
  });
  const [requestId, setRequestId] = useState<number | undefined>(undefined);
  useEffect(() => {
    let getRequest = async () => {
      if (!router.query.requestid) return;
      const res = await authenticatedGetFetch('/request/get_info', {
        request_id: `${router.query.requestid}`,
      });
      if (!res.ok) return <Error statusCode={res.status} />;
      let d = await res.json();
      setQueueData(toCamelCase(d));
      setStatus(d.status);
    };
    let getStartTime = async () => {
      if (!router.query.requestid) return;
      const res = await authenticatedGetFetch('/logs/get_start_time', {
        request_id: `${router.query.requestid}`,
      });
      let d = await res.json();
      setStartTime(toCamelCase(d?.event_time));
    };
    getStartTime();
    getRequest();
  }, [router.query.requestid]);

  useEffect(() => {
    if (!router.query.requestid) return;
    setRequestId(Number.parseInt(`${router.query.requestid}`));
  }, [router.query.requestid]);

  const updateStatus = async (status: Status) => {
    const res = await authenticatedPutFetch('/request/set_status', {
      request_id: Number.parseInt(`${router.query.requestid}`),
      status,
    });
    if (!res.ok) {
      console.log(
        'error: something went wrong with resolve request; check network tab'
      );
      return;
    }
    setStatus(status);
    if (status !== Status.Seeing) {
      router.push(`/active-queue/${queueData.queueId}`);
    }

  };


  return (
    <>
      <MetaData />
      <Header />
      <div className={styles.pageContainer}>
        <div className={styles.body}>
          {/* TODO: fix the colours */}
          <div className={styles.buttonContainer}>
            {status === Status.Seeing && (
              <Button
                className={styles.greenButton}
                variant="contained"
                onClick={() => updateStatus(Status.Seen)}
              >
                Resolve
              </Button>
            )}
            {status === Status.Unseen && (
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
            {status === Status.Seen && (
              <Button
                className={styles.greenButton}
                variant="contained"
                onClick={() => updateStatus(Status.Unseen)}
              >
                Unresolve
              </Button>
            )}
            {status === Status.NotFound && (
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
            <TimeSummaryCard startTime={startTime} status={status}/>
          </div>
          <div className={styles.details}>
            <RequestDetails requestId={requestId} isTutorView={true}/>
          </div>
        </div>
      </div>
    </>
  );
};

export default Request;

