import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import styles from './WaitingScreen.module.css';
import { useRouter } from 'next/router';
import StudentRequestCard from '../../../components/StudentRequestCard';
import {
  authenticatedGetFetch,
  toCamelCase,
  authenticatedPutFetch,
} from '../../../utils';
import Header from '../../../components/Header';
import TagBox from '../../../components/TagBox';
import InformationCard from '../../../components/InformationCard';
import { QueueData } from '../../../types/queues';
import ChatBox from '../../../components/ChatBox';
import { Status } from '../../../types/requests';
import FAQs from '../../../components/FAQs';
import useAuthenticatedWebSocket from '../../../hooks/useAuthenticatedWebSocket';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    tags: [
      {
        name: 'tag',
        isPriority: false,
        tagId: 1,
      },
    ],
    isClusterable: false,
    previousRequests: 5,
    description: '',
  });
  const [isClusterable, setIsClusterable] = useState(requestData.isClusterable);
  const [queueData, setQueueData] = useState<QueueData>();
  const [waitingTime, setWaitingTime] = useState(0);
  const [positionInQueue, setPositionInQueue] = useState(0);

  const disableCluster = async () => {
    const res = await authenticatedPutFetch('/request/disable_cluster', {
      request_id: Number.parseInt(`${router.query.requestid}`),
    });
    if (!res.ok) {
      console.log('error');
      return;
    }
    setIsClusterable(false);
    return;
  };

  useEffect(() => {
    let getRequest = async () => {
      let res = await authenticatedGetFetch('/request/get_info', {
        request_id: `${router.query.requestid}`,
      });
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
  }, [router.query.requestid, router]);

  useEffect(() => {
    let getQueueData = async () => {
      let res = await authenticatedGetFetch('/queue/get', {
        queue_id: `${requestData.queueId}`,
      });
      let d = await res.json();
      setQueueData(toCamelCase(d));
    };
    getQueueData();
  }, [requestData.queueId]);

  useEffect(() => {
    let getNumberOfRequests = async () => {
      if (!queueData) return;
      let res = await authenticatedGetFetch('/request/all_requests_for_queue', {
        queue_id: `${requestData.queueId}`,
      });
      let d = toCamelCase(await res.json());
      if (!d) return;

      let unresolvedRequests = 0;
      for (const request of d) {
        if (
          request.requestId === Number.parseInt(`${router.query.requestid}`)
        ) {
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

  const resolveRequest = async () => {
    const res = await authenticatedPutFetch('/request/set_status', {
      request_id: Number.parseInt(`${router.query.requestid}`),
      status: Status.Seen,
    });
    if (!res.ok) {
      console.log(
        'error: something went wrong with resolve request; check network tab'
      );
      return;
    }
    router.push(`/request-summary/${router.query.requestid}`);
  };

  let { lastJsonMessage } = useAuthenticatedWebSocket('ws:localhost:8000/ws/queue', {
    queryParams: {queue_id: requestData.queueId},
    onOpen: () => {
      console.log('connected [queue data]');
    }
  });

  useEffect(() => {
    if (!lastJsonMessage) return;
    setQueueData(queueData => ({...queueData, ...((lastJsonMessage as any)?.queue)}));
  }, [lastJsonMessage]);

  useEffect(() => {
    if (!queueData?.announcement) return;
    toast.info(queueData.announcement,  {
      position: 'top-center',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'light',
    });
  }, [queueData?.announcement]);

  return (
    <>
      <ToastContainer
        position="top-left"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Header />
      <div className={styles.pageContainer}>
        <div className={styles.queueTitle}>
          <Typography variant="h3">{queueData?.title}</Typography>
        </div>
        {/* make state variable for isclusterable  */}
        {isClusterable ? (
          <div className={styles.clusterContainer}>
            <TagBox
              text="You have been added to a cluster by the tutor! You question will be answered as a group. Click the button to remove yourself"
              backgroundColor="var(--colour-main-orange-200)"
              color="var(--colour-main-orange-900)"
            />
            <Button className={styles.removeBtn} onClick={disableCluster}>
              Remove
            </Button>
          </div>
        ) : null}
        <div className={styles.body}>
          <div className={styles.buttonContainer}>
            <Button
              className={styles.greenButton}
              variant="contained"
              onClick={resolveRequest}
            >
              Resolve
            </Button>
            <Button
              className={styles.greyButton}
              variant="contained"
              onClick={() =>
                router.push(`/edit-request/${router.query.requestid}`)
              }
            >
              Edit Request
            </Button>
            <InformationCard
              content={[
                `Current Position: ${positionInQueue}`,
                `Estimated Waiting Time: ${waitingTime} mins`,
              ]}
            />
            <InformationCard
              title="Announcement"
              content={[queueData?.announcement as string]}
            />
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
            <FAQs courseOfferingId={queueData?.courseOfferingId} tutor={false} />
          </Box>
          <div className={styles.chatContainer}>
            <ChatBox requestId={Number.parseInt(`${router.query.requestid}`)} zid={requestData.zid}/>
          </div>
        </div>
      </div>
    </>
  );
};

export default WaitingScreen;
