import styles from './Cluster.module.css';
import React, { useEffect, useState } from 'react';
import { Typography, Button } from '@mui/material';
import { useRouter } from 'next/router';
import Header from '../../../components/Header';
import MetaData from '../../../components/MetaData';
import {
  authenticatedGetFetch,
  authenticatedPutFetch,
  toCamelCase,
} from '../../../utils';
import { Status } from '../../../types/requests';
import RequestDetails from '../../../components/RequestDetails';

const Cluster = () => {
  const router = useRouter();
  const [status, setStatus] = useState(Status.Seeing);
  const [clusterData, setClusterData] = useState([{
    queueId: 1,
    requestId: 1,
    status: Status.Seeing,
    title: 'COMP1521 Thursday Week 5 Help Session',
  }]);

  useEffect(() => {
    let getCluster = async () => {
      if (!router.query.clusterid) return;
      const res = await authenticatedGetFetch('/queue/cluster/get', {
        cluster_id: `${router.query.clusterid}`,
      });
      let d = await res.json();
      setClusterData(toCamelCase(d));
    };
    getCluster();
  }, [router.query.clusterid]);

  const updateStatus = async (status: Status) => {
    const res = await Promise.all(clusterData.map((request) => authenticatedPutFetch('/request/set_status', {
      request_id: request.requestId,
      status,
    })));
    if (res.some((r) => !r.ok)) {
      console.log(
        'error: something went wrong with resolve request; check network tab'
      );
      return;
    }
    setStatus(status);
    if (status !== Status.Seeing) {
      router.push(`/active-queue/${clusterData[0].queueId}`);
    }

  };


  return (
    <>
      <MetaData />
      <Header />
      <div className={styles.pageContainer}>
        <div className={styles.queueTitle}>
          <Typography variant="h2">{clusterData[0].title + ' cluster'}</Typography>
        </div>
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
          </div>
          <div className={styles.clusterRequests}>
            { clusterData.map(
              (request) => <RequestDetails key={request.requestId} requestId={request.requestId} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Cluster;
