import styles from './ClusterStudentView.module.css';
import React, { useEffect, useState } from 'react';
import { Button, Typography, } from '@mui/material';
import { useRouter } from 'next/router';
import Header from '../../../components/Header';
import MetaData from '../../../components/MetaData';
import {
  authenticatedGetFetch,
  toCamelCase,
} from '../../../utils';
import { Status } from '../../../types/requests';
import RequestDetails from '../../../components/RequestDetails';

const ClusterStudentView = () => {
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
      let d = toCamelCase(await res.json());
      setClusterData(d);
      setStatus(status => d.length > 0 ? d[0].status : status);
    };
    getCluster();
  }, [router.query.clusterid]);


  console.log(status);
  return (
    <>
      <MetaData />
      <Header />
      <div className={styles.pageContainer}>
        <div className={styles.queueTitle}>
          <Typography variant="h2">{ clusterData.length > 0 && clusterData[0].title + ' cluster'}</Typography>
        </div>
        <div className={styles.body}>
          <div className={styles.buttonContainer}>
            <Button 
              className={styles.greyButton}
              variant="contained"
              onClick={() => {
                router.back();
              }}
            >
              Back 
            </Button>
          </div>
          <div className={styles.clusterRequests}>
            { clusterData.map(
              (request) => <RequestDetails key={request.requestId} requestId={request.requestId} isTutorView={false}/>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ClusterStudentView;
