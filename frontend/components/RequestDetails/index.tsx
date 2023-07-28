import styles from './RequestDetails.module.css';
import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import StudentRequestCard from '../StudentRequestCard';

import { Status } from '../../types/requests';
import ChatBox from '../ChatBox';
import { authenticatedGetFetch, toCamelCase } from '../../utils';
import useAuthenticatedWebSocket from '../../hooks/useAuthenticatedWebSocket';

type RequestDetailsProps = {
  requestId: number | undefined;
};

const RequestDetails = ({ requestId }: RequestDetailsProps) => {
  const [data, setData] = useState({
    zid: 5303033,
    queueId: 1,
    queueTitle: 'COMP1521 Thursday Week 5 Help Session',
    firstName: 'Jane',
    lastName: 'Doe',
    requestId: undefined,
    status: Status.Seeing,
    previousRequests: 1,
    images: ['http://localhost:8000/images/1/image.png'],
    title: 'Pls help me with printing this array - im so stuck!',
    tags: [{ name: 'Assignment 1', tagId: 1, isPriority: false }],
    isClusterable: false,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  });
  let { lastJsonMessage } = useAuthenticatedWebSocket('ws:localhost:8000/ws/request', {
    queryParams: {request_id: requestId as unknown as number},
    onOpen: () => {
      console.log(`connected [request data] with requestId ${requestId}`);
    },
    shouldReconnect: () => true,
  }, !!requestId);

  useEffect(() => {
    let getRequest = async () => {
      if (!requestId) return;
      const res = await authenticatedGetFetch('/request/get_info', {
        request_id: `${requestId}`,
      });
      let d = await res.json();
      setData(toCamelCase(d));
    };
    getRequest();
  }, [requestId]);
  
  useEffect(() => {
    console.log('new_msg_request: ', lastJsonMessage);
    if (!lastJsonMessage || (lastJsonMessage as any).type !== 'request_data') return;
    console.log('new_msg_request running: ', lastJsonMessage);
    let data = toCamelCase(lastJsonMessage);
    setData(data.content);
  }, [lastJsonMessage]);

  return (
    <div className={styles.detailsContainer}>
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
          images={data.images}
        />
      </Box>
      <div className={styles.chatContainer}>
        <ChatBox requestId={requestId} isStudent={false} studentZid={data.zid} />
      </div>
    </div>
  );
};

export default RequestDetails;

