import useAuthenticatedWebSocket from '../../../hooks/useAuthenticatedWebSocket';
import { useRouter } from 'next/router';
import MetaData from '../../../components/MetaData';
import Header from '../../../components/Header';
import styles from './QueueRequests.module.css';
import { ClusterRequest, UserRequest, isCluster } from '../../../types/requests';
import { useEffect, useState } from 'react';
import { Box, Button, Modal, Typography } from '@mui/material';
import { authenticatedGetFetch, authenticatedPostFetch, authenticatedPutFetch, toCamelCase } from '../../../utils';
import StudentQueueRequestCard from '../../../components/StudentQueueRequestCard';
import StudentQueueClusterRequestCard from '../../../components/StudentQueueClusterRequestCard';

const QueueRequests = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<(UserRequest | ClusterRequest)[]>([]);
  const [open, setOpen] = useState(false);
  const [modalData, setModalData] = useState<UserRequest>();
  const [ownRequest, setOwnRequest] = useState<UserRequest | ClusterRequest>();
  const [requestData, setRequestData] = useState({
    title: 'COMP1521 Thursday Week 5 Help Session',
    queueId: 1,
    courseOfferingId: 1,
    requests,
  });

  let { lastJsonMessage } = useAuthenticatedWebSocket('ws/queue', {
    queryParams: {queue_id: `${router.query.queueid}` as unknown as number},
    onOpen: () => {
      console.log('connected [queue data]');
    },
    shouldReconnect: () => true,
  }, !!router.query.queueid);

  // update the queue data
  useEffect(() => {
    if (!lastJsonMessage) return;
    console.debug('new_msg: ', lastJsonMessage);
    if ((lastJsonMessage as any)?.type === 'queue_data') {
      let newRequestsData = (lastJsonMessage as any).requests;
      console.debug('newRequestsData', newRequestsData);
      setRequests(transformRequests(toCamelCase(newRequestsData)));
    }

  }, [lastJsonMessage, router.query.requestid]);

  useEffect(() => {
    setOwnRequest(requests.find((r) => {
      if (isCluster(r)) {
        return r.requests.find((r) => r.requestId === Number.parseInt(router.query.requestid as string));
      } else {
        return r.requestId === Number.parseInt(router.query.requestid as string);
      }
    }));
  }, [requests, router.query.requestid]);

  const transformRequests = (reqList: UserRequest[]): (UserRequest | ClusterRequest)[]  => {
    // collapse requests with the same clusterId
    let clusterIdToRequest = new Map<number, UserRequest[]>();
    reqList.forEach((r) => {
      if (!r.clusterId) return;
      let clusterList = clusterIdToRequest.get(r.clusterId);
      if (!clusterList) {
        clusterIdToRequest.set(r.clusterId, [r]);
      } else {
        clusterList.push(r);
      }
    });
    let newReqList: (UserRequest | ClusterRequest)[] = [];
    for (const request of reqList) {
      if (!request.clusterId) {
        newReqList.push(request);
      } else {
        let clusterList = clusterIdToRequest.get(request.clusterId);
        // only look for the first request
        if (!clusterList || clusterList[0].requestId !== request.requestId)
          continue;
        
        newReqList.push({
          requests: clusterList,
          clusterId: request.clusterId,
        });
      }
    }
    return newReqList;
  };

  useEffect(() => {
    let getRequests = async () => {
      let res = await authenticatedGetFetch('/request/all_requests_for_queue', {queue_id: `${router.query.queueid}`});
      // yolo assume OK
      let d = await res.json();

      setRequests(transformRequests(toCamelCase(d)));
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

  const createCluster = async (otherReqId: number) => {
    if (!otherReqId) return;
    const res = await authenticatedPostFetch('/queue/cluster/create', {
      queue_id: Number.parseInt(router.query.queueid as string),
      request_ids: [Number.parseInt(`${router.query.requestid}`), otherReqId],
    });
    if (!res.ok) {
      console.log(res);
    }
  };

  const joinCluster = (clusterId: number) => {
    if (!clusterId) return;
    const res = authenticatedPutFetch('/queue/cluster/join', {
      cluster_id: clusterId,
      request_id: Number.parseInt(`${router.query.requestid}`),
    });
    console.log(res);
  };

  const leaveCluster = (clusterId: number) => {
    if (!clusterId) return;
    const res = authenticatedPutFetch('/queue/cluster/leave', {
      cluster_id: clusterId,
      request_id: Number.parseInt(`${router.query.requestid}`),
    });
    console.log(res);
  };

  return (
    <>
      <MetaData />
      <Header />
      <div className={styles.pageContainer}>
        <div className={styles.queueTitle}>
          <Typography variant="h2">{requestData.title}</Typography>
        </div>
        <div className={styles.body}>
          <div className={styles.buttonContainer}>
            <Button variant="contained" size="large" className={styles.greyButton} onClick={() => router.back()}>
                Return to Request
            </Button>
          </div>
          <Box className={styles.cardBox}>
            <div className={styles.requestCardContainer}>
              {requests && requests.length !== 0 ? (
                requests.map((request) => (
                  !isCluster(request) ? (
                    <div  key={`key ${request.requestId}`} className={styles.requestCard}>
                      <StudentQueueRequestCard
                        requestId={request.requestId}
                        zid={request.zid}
                        firstName={request.firstName}
                        lastName={request.lastName}
                        tags={request.tags}
                        title={request.title}
                        status={request.status}
                        previousRequests={request.previousRequests}
                        isTutorView={false}
                        onClickAction={() => {
                          setModalData(request);
                          setOpen(true);
                        }}
                        createClusterAction={request.requestId !== Number.parseInt(`${router.query.requestid}` as string) && !(ownRequest?.clusterId) && (ownRequest as UserRequest)?.isClusterable && request.isClusterable ? () => createCluster(request.requestId) : undefined}
                      /> 
                    </div>
                  ) : (
                    <div key={`cluster ${request.clusterId}`} className={styles.requestCard}>
                      <StudentQueueClusterRequestCard
                        clusterId={request.clusterId}
                        requests={request.requests}
                        isTutorView={false}
                        joinClusterAction={request.requests.findIndex((r) => r.requestId === Number.parseInt(`${router.query.requestid}` as string)) === -1 && (ownRequest as UserRequest)?.isClusterable ? () => joinCluster(request.clusterId) : undefined}
                        leaveClusterAction={request.requests.findIndex((r) => r.requestId === Number.parseInt(`${router.query.requestid}` as string)) !== -1 ? () => leaveCluster(request.clusterId) : undefined}
                        allRequests={requests}
                      />
                    </div>
                  )
                ))
              ) : (
                <div>There are no requests</div>
              )}
            </div>
          </Box>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <div className={styles.modalContainer}>
          <Typography variant="h3"> { modalData && modalData.title} </Typography>
          <div className={styles.requestDataModal}>
            {`Description: ${modalData && modalData.description}`}
          </div>
          {modalData && modalData.requestId !== Number.parseInt(`${router.query.requestid}` as string) && !(ownRequest?.clusterId) && modalData.isClusterable && (
            <Button variant="contained" size="large" className={styles.clusterButton} onClick={() => createCluster(modalData.requestId)}>
                    Create Cluster
            </Button>)}
        </div>
      </Modal>    
    </>
  );
};


export default QueueRequests;
