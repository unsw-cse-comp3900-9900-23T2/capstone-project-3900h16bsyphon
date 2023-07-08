import { Box, Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';
import styles from './ActiveQueue.module.css';
import { useRouter } from 'next/router';
import StudentQueueRequestCard from '../../../components/StudentQueueRequestCard';
import MetaData from '../../../components/MetaData';
import Header from '../../../components/Header';
import { useEffect, useState } from 'react';
import { authenticatedGetFetch, authenticatedPutFetch, toCamelCase } from '../../../utils';
import { Tag, UserRequest } from '../../../types/requests';

const ActiveQueue = () => {
  const router = useRouter();
  
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [requestData, setRequestData] = useState({
    title: 'COMP1521 Thursday Week 5 Help Session',
    queueId: 1,
    courseOfferingId: 1,
    requests,
  });
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    let getRequests = async () => {
      let res = await authenticatedGetFetch('/request/all_requests_for_queue', {queue_id: `${router.query.queueid}`});
      // yolo assume OK
      let d = await res.json();
      setRequests(toCamelCase(d));
    };
    let getQueueData = async () => {
      let res = await authenticatedGetFetch('/queue/get', {queue_id: `${router.query.queueid}`});
      let d = await res.json();
      setRequestData(toCamelCase(d));
    };
    let getQueueTags = async () => {
      let res = await authenticatedGetFetch('/queue/tags', {queue_id: `${router.query.queueid}`});
      let d = await res.json();
      setTags(toCamelCase(d));
    };
    if (!router.query.queueid) return;
    getRequests();
    getQueueData();
    getQueueTags();
  }, [router.query.queueid]);
  
  const flipTagPriority = async (e: SelectChangeEvent<number>) => {
    e.preventDefault();
    let tagId = e.target.value;
    let tag = tags.find((t) => t.tagId === tagId);
    await authenticatedPutFetch(
      '/queue/tags/set_priority',
      {
        queue_id: Number.parseInt(router.query.queueid as string),
        is_priority: !tag?.isPriority,
        tag_id: tagId,
      }
    );
    router.reload();
  };

  const handleCopyQueueLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return <>
    <MetaData />
    <Header />
    <div className={styles.pageContainer}>
      <div className={styles.queueTitle}>
        <Typography variant='h2'>
          {requestData.title}
        </Typography>
      </div>
      <div className={styles.body}>
        <div className={styles.buttonContainer}>
          <FormControl size='small' >
            <InputLabel className={styles.label} id="sort-queue-select-label"> Sort Queue </InputLabel>
            <Select
              labelId="sort-queue-select-label"
              id="sort-queue-select"
              label='Sort Queue'
              className={styles.select}
              displayEmpty
              onChange={flipTagPriority}
              sx={{ boxShadow: 'none', '.MuiOutlinedInput-notchedOutline': { border: 0 } }}
            >
              {tags.map((tag) => (<MenuItem key={tag.tagId} value={tag.tagId}>{tag.isPriority ? 'Unprioritise':  'Prioritise'} &quot;{tag.name}&quot;</MenuItem>))}
            </Select>
          </FormControl>
          <Button className={styles.closeQueueButton} variant='contained' onClick={() => router.push(`/course/${requestData.courseOfferingId}`)}>Close Queue</Button>
        </div>
        <Box className={styles.cardBox}>
          <div className={styles.requestCardContainer}>
            {requests && requests.length !== 0 ? (
              requests.map((request) => (
                <StudentQueueRequestCard
                  key={request.requestId}
                  requestId={request.requestId}
                  zid={request.zid}
                  firstName={request.firstName}
                  lastName={request.lastName}
                  tags={request.tags}
                  title={request.title}
                  status={request.status}
                  queueId={router.query.queueid as string | undefined}
                />
              ))
            ) : (
              <div> There are no requests </div>
            )}
          </div>
        </Box>
        <div className={styles.buttonContainer}>
          <Button className={styles.genericButton} variant='contained' onClick={handleCopyQueueLink}>Copy Queue Link</Button>
          <Button className={styles.settingsButton} variant='contained' onClick={() => router.push(`/course/${requestData.courseOfferingId}`)}>Settings</Button>
        </div>
      </div>
    </div>
  </>;
};

export default ActiveQueue;
