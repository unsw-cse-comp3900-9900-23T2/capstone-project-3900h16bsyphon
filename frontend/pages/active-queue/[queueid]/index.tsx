import { Box, Button, Card, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';
import styles from './ActiveQueue.module.css';
import { useRouter } from 'next/router';
import StudentQueueRequestCard from '../../../components/StudentQueueRequestCard';
import MetaData from '../../../components/MetaData';
import Header from '../../../components/Header';
import { useEffect, useState } from 'react';
import { authenticatedGetFetch, authenticatedPutFetch, toCamelCase } from '../../../utils';
import { Tag, UserRequest } from '../../../types/requests';
import dayjs from 'dayjs';
import InfoIcon from '@mui/icons-material/Info';

const ActiveQueue = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [requestData, setRequestData] = useState({
    title: 'COMP1521 Thursday Week 5 Help Session',
    queueId: 1,
    courseOfferingId: 1,
    isSortedByPreviousRequestCount: false,
    requests,
  });
  const [tags, setTags] = useState<Tag[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [numReqsUntilClose, setNumReqsUntilClose] = useState(0);

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
    let getStudentCount = async () => {
      let res = await authenticatedGetFetch('/queue/get_student_count', {
        queue_id: `${router.query.queueid}`,
      });
      let d = await res.json();
      setStudentCount(toCamelCase(d));
    };
    let getNumRequestsUntilClose = async () => {
      let res = await authenticatedGetFetch('/queue/get_num_requests_until_close', {
        queue_id: `${router.query.queueid}`,
      });
      let d = await res.json();
      setNumReqsUntilClose(toCamelCase(d));
    };
    if (!router.query.queueid) return;
    getRequests();
    getQueueData();
    getQueueTags();
    getStudentCount();
    getNumRequestsUntilClose();
  }, [router.query.queueid]);

  const flipTagPriority = async (tagId: number) => {
    let tag = tags.find((t) => t.tagId === tagId);
    await authenticatedPutFetch(
      '/queue/tags/set_priority',
      {
        queue_id: Number.parseInt(router.query.queueid as string),
        is_priority: !tag?.isPriority,
        tag_id: tagId,
      }
    );
  };

  const flipRequestCountPriority = async () => {
    await authenticatedPutFetch(
      '/queue/set_is_sorted_by_previous_request_count',
      {
        queue_id: Number.parseInt(router.query.queueid as string),
        is_sorted_by_previous_request_count: !requestData.isSortedByPreviousRequestCount,
      }
    );
  };

  const handleSubmit = async (e: SelectChangeEvent<number | string>) => {
    e.preventDefault();
    if (typeof(e.target.value) === 'number') {
      await flipTagPriority(e.target.value);
    } else if (e.target.value === 'prevRequestCount') {
      await flipRequestCountPriority();
    }
    router.reload();
  };

  const handleCopyQueueLink = () => {
    navigator.clipboard.writeText(window.location.href.replace('active-queue', 'create-request'));
  };

  const handleCloseQueue = async () => {
    const res = await authenticatedPutFetch('/queue/close', { 
      queue_id: Number.parseInt(`${router.query.queueid}`), 
      end_time: dayjs(new Date()).format('YYYY-MM-DDTHH:mm:ss')
    });
    if (!res.ok) {
      console.log(res.body);
      return;
    }
    router.push(`/course/${requestData.courseOfferingId}`);
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
      <Card className={styles.infoCard}>
        <InfoIcon />
        <Typography>
          There {studentCount === 1 ? 'is' : 'are'} {studentCount}
          {studentCount === 1 ? ' student' : ' students'} remaining in the queue.
        </Typography>
        <Typography>Based on the remaining time of the queue, we estimate {numReqsUntilClose} request{numReqsUntilClose > 1 ? 's' : ''} can be resolved.</Typography>
      </Card>
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
              onChange={handleSubmit}
              sx={{ boxShadow: 'none', '.MuiOutlinedInput-notchedOutline': { border: 0 } }}
            >
              {tags.map((tag) => (<MenuItem key={tag.tagId} value={tag.tagId}>{tag.isPriority ? 'Unprioritise':  'Prioritise'} &quot;{tag.name}&quot;</MenuItem>))}
              <MenuItem key={'key'} value='prevRequestCount'>{requestData.isSortedByPreviousRequestCount ? 'Unprioritise':  'Prioritise'} by number of previous requests</MenuItem>
            </Select>
          </FormControl>
          <Button className={styles.closeQueueButton} variant='contained' onClick={handleCloseQueue}>Close Queue</Button>
        </div>
        <Box className={styles.cardBox}>
          <div className={styles.requestCardContainer}>
            {requests && requests.length !== 0 ? (
              requests.map((request) => (
                <StudentQueueRequestCard
                  key={request.order}
                  requestId={request.requestId}
                  zid={request.zid}
                  firstName={request.firstName}
                  lastName={request.lastName}
                  tags={request.tags}
                  title={request.title}
                  status={request.status}
                  previousRequests={request.previousRequests}
                />
              ))
            ) : (
              <div>There are no requests</div>
            )}
          </div>
        </Box>
        <div className={styles.buttonContainer}>
          <Button className={styles.genericButton} variant='contained' onClick={handleCopyQueueLink}>Copy Queue Link</Button>
          <Button className={styles.settingsButton} variant='contained' onClick={() => router.push(`/edit-queue/${router.query.queueid}`)}>Settings</Button>
        </div>
      </div>
    </div>
  </>;
};

export default ActiveQueue;
