import MetaData from '../../../components/MetaData';
import Header from '../../../components/Header';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import styles from './ViewQueue.module.css';
import QueueCard from '../../../components/QueueCard';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { authenticatedGetFetch, toCamelCase } from '../../../utils';


const ViewQueue = () => {
  const router = useRouter();
  const [data, setData] = useState([
    {
      queueId: 1,
      title: 'COMP1000 Week 3 Friday 16:00-18:00 Help Session',
      seen: 5,
      unseen: 4,
      startTime: '2023-06-29T05:13:07',
      endTime: '2023-06-29T07:13:07',
      location: ['Brass Lab', 'Online'],
      courseAdmins: ['Hussain', 'Peter'],
      isEdit: true,
    },
  ]);
  const [courseData, setCourseData] = useState<any>({title: 'COMP1000'});
  const [queueList, setQueueList] = useState([
    {
      queueId: 1,
      title: 'COMP1000 Week 3 Friday 16:00-18:00 Help Session',
      seen: 5,
      unseen: 4,
      startTime: '2023-06-29T05:13:07',
      endTime: '2023-06-29T07:13:07',
      location: ['Brass Lab', 'Online'],
      courseAdmins: ['Hussain', 'Peter'],
      isEdit: true,
    }
  ]);

  useEffect(() => {
    let getQueues = async () => {
      if (!router.query.id) return;
      let res = await authenticatedGetFetch('/queue/get_by_course', {course_id: `${router.query.id}`});
      let d = await res.json();
      setData(toCamelCase(d));
    };
    let getActiveQueues = async () => {
      if (!router.query.id) return;
      let res1 = await authenticatedGetFetch('/queues/active/list', {course_id: `${router.query.id}`});
      let d1 = await res1.json();
      console.log('d1', d1);
      setQueueList(toCamelCase(d1));
    };
    getQueues();
    getActiveQueues();
  }, [router.query.id]);

  return (
    <>
      <MetaData />
      <Header />
      <div className={styles.container}>
        <Typography variant="h3" className={styles.title}>{courseData.title}</Typography>
        <div className={styles.section}>
          <h1 className={styles.heading}>Live</h1>
          <Button startIcon={<AddIcon />} className={styles.newQueueBtn} onClick={() => { router.push(`/queue-creation/${router.query.id}`); }}>New Queue</Button>
          {queueList?.map((d, index) => (
            <QueueCard queueId={d.queueId} key={index} title={d.title} location={[]} courseAdmins={d.courseAdmins} isEdit={d.isEdit} seen={d.seen} unseen={d.unseen}/>
          ))} 
        </div>
        <div className={styles.cards}>
          {data?.filter((d) => Date.parse(d.startTime) < Date.now() && Date.parse(d.endTime) > Date.now()).map((d, index) => (
            <QueueCard queueId={d.queueId} key={index} title={d.title} location={[]} courseAdmins={d.courseAdmins} isEdit={d.isEdit} seen={d.seen} unseen={d.unseen}/>
          ))}
        </div>
        <div className={styles.section}>
          <h1 className={styles.title}>Upcoming</h1>
        </div>
        <div className={styles.cards}>
          {data?.filter((d) => Date.parse(d.startTime) > Date.now()).map((d, index) => <QueueCard queueId={d.queueId} key={index} title={d.title} location={[]} courseAdmins={d.courseAdmins} isEdit={d.isEdit}/>)}
        </div>
        <div className={styles.section}>
          <h1 className={styles.title}>Previous</h1>
        </div>
        <div className={styles.cards}>
          {data?.filter((d) => Date.parse(d.endTime) < Date.now()).map((d, index) => <QueueCard queueId={d.queueId} key={index} title={d.title} location={[]} courseAdmins={d.courseAdmins} seen={d.seen} unseen={d.unseen}/> )}
        </div>
      </div>
    </>
  );
};

export default ViewQueue;
