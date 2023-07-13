import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
} from '@mui/material';
import styles from './WaitingScreen.module.css';
import { useRouter } from 'next/router';
import StudentRequestCard from '../../../components/StudentRequestCard';
import { authenticatedGetFetch, toCamelCase, authenticatedPutFetch } from '../../../utils';
import Header from '../../../components/Header';
import TagBox from '../../../components/TagBox';
import InformationCard from '../../../components/InformationCard';
import { QueueData } from '../../../types/queues';
import { RequestData, Status } from '../../../types/requests';

const WaitingScreen = () => {
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
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  });
  const [reqState, setReqState] = useState('Unresolved');
  const [queueData, setQueueData] = useState<QueueData>();
  const [waitingTime, setWaitingTime] = useState(0);
  const [positionInQueue, setPositionInQueue] = useState(0);

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
    if (!router.query.requestid) {
      return;
    }
    getRequest();

  }, [router.query.requestid]);

  useEffect(() => {
    let getQueueData = async () => {
      let res = await authenticatedGetFetch('/queue/get', {queue_id: `${requestData.queueId}`});
      let d = await res.json();
      setQueueData(toCamelCase(d));
    };
    getQueueData();
  }, [requestData.queueId]);

  useEffect(() => {
    let getNumberOfRequests = async () => {
      if (!queueData) {
        return;
      }
      let res = await authenticatedGetFetch('/request/all_requests_for_queue', {queue_id: `${requestData.queueId}`});
      let d = toCamelCase(await res.json());
      if (!d) {
        return;
      }
      console.log(d);

      let unresolvedRequests = 0;
      for (let i = 0; i < d.length; i++) {
        let request = d[i] as RequestData;
        if (request.requestId === Number.parseInt(`${router.query.requestid}`)) {
          setPositionInQueue(unresolvedRequests + 1);
          break;
        }
        if (request.status === Status.Unseen) {
          unresolvedRequests++;
        } 
      }
      if (queueData.timeLimit) {
        setWaitingTime(queueData.timeLimit * (positionInQueue - 1));
      } else {
        setWaitingTime((positionInQueue - 1) * 20);
      }
    };

    getNumberOfRequests();
  }, [queueData, requestData.queueId, router.query.requestid, positionInQueue]);

  const handleResolve = () => {

    const resolveRequest = async () => {
      const res = await authenticatedPutFetch('/request/set_status', {request_id: Number.parseInt(`${router.query.requestid}`), status: Status.Seen});
      if (!res.ok) {
        console.log('error: something went wrong with resolve request; check network tab');
        return;
      }
      router.push('/dashboard');
    };
    resolveRequest();
  };

  return (
    <>
      <Header />
      <div className={styles.pageContainer}>
        <div className={styles.queueTitle}>
          <Typography variant='h3'>
            {requestData.queueTitle}
          </Typography>
        </div>
        {requestData.isClusterable ? (
          <div className={styles.clusterContainer}>
            <TagBox
              text="You have been added to a cluster by the tutor! You question will be answered as a group. Click the button to remove yourself"
              backgroundColor="var(--colour-main-orange-200)"
              color="var(--colour-main-orange-900)"
            />
            <Button className={styles.removeBtn} onClick={disableCluster}>Remove</Button>
          </div>
        ) : null}
        <div className={styles.body}>
          <div className={styles.buttonContainer}>
            <Button className={styles.greenButton} variant='contained' onClick={handleResolve}>Resolve</Button>
            <Button className={styles.greyButton} variant='contained' onClick={() => router.push(`/edit-request/${router.query.requestid}`)}>Edit Request</Button>
            <InformationCard content={[`Current Position: ${positionInQueue}`, `Estimated Waiting Time: ${waitingTime} mins`]} />
            <InformationCard title="Announcement" content={[queueData?.announcement as string]} />
          </div>
          <Box className={styles.cardBox}>
            <StudentRequestCard
              zid={requestData.zid}
              status={requestData.status}
              firstName={requestData.firstName}
              lastName={requestData.lastName}
              tags={requestData.tags}
              title={requestData.title}
              queueId={requestData.queueId}
              description={requestData.description}
            />
          </Box>
          <div className={styles.chatContainer}>
            {/* please place the chat component inside this div! */}
          </div>
        </div>
      </div>
    </>
  );
};

export default WaitingScreen;
