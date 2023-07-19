import MetaData from '../../../components/MetaData';
import Header from '../../../components/Header';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import styles from './course.module.css';
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
      isVisible: true,
      startTime: '2023-06-29T05:13:07',
      endTime: '2023-06-29T07:13:07',
      location: ['Brass Lab', 'Online'],
      courseAdmins: ['Hussain', 'Peter'],
      isEdit: true,
    },
  ]);
  const [courseData, setCourseData] = useState<any>({title: 'COMP1000'});
  const [isTutor, setIsTutor] = useState(false);
  useEffect(() => {
    let getQueues = async () => {
      if (!router.query.courseid) return;
      const res = await authenticatedGetFetch('/queue/get_by_course', {course_id: `${router.query.courseid}`});
      let d = await res.json();
      setData(toCamelCase(d));
    };
    let getCourse = async () => {
      if (!router.query.courseid) return;
      const res = await authenticatedGetFetch('/course/get', {course_id: `${router.query.courseid}`});
      let d = await res.json();
      setCourseData(toCamelCase(d));
    };
    let getTutored = async () => {
      const res = await authenticatedGetFetch('/course/get_tutored', {});
      let d = await res.json();
      setIsTutor(
        toCamelCase(d).some((course: {courseCode: string}) => course.courseCode === courseData.courseCode)
      );
    };
    if (!router.query.courseid) return;
    getQueues();
    getCourse();
    getTutored();
  }, [courseData.courseCode, router.query.courseid]);

  return (
    <>
      <MetaData />
      <Header />
      <Typography variant="h3" className={styles.title}>{`${courseData.courseCode}: ${courseData.title}`}</Typography>
      <div className={styles.container}>
        <div className={styles.section}>
          <h1 className={styles.heading}>Live</h1>
          { isTutor && <Button startIcon={<AddIcon />} className={styles.newQueueBtn} onClick={() => { router.push(`/create-queue/${router.query.courseid}`); }}>New Queue</Button>}
        </div>
        <div className={styles.cards}>
          {data
            .filter((d) => Date.parse(d.startTime) < Date.now() && Date.parse(d.endTime) > Date.now())
            .filter((d) => isTutor || d.isVisible)
            .map((d, index) => <QueueCard isTutor={isTutor} queueId={d.queueId} key={index} title={d.title} location={[]} courseAdmins={d.courseAdmins} isEdit={d.isEdit}/>)
          }
          {data
            .filter((d) => Date.parse(d.startTime) < Date.now() && Date.parse(d.endTime) > Date.now())
            .filter((d) => isTutor || d.isVisible)
            .length === 0 && <p>No live queues</p>}
        </div>
        <h1 className={styles.heading}>Upcoming</h1>
        <div className={styles.cards}>
          {data
            .filter((d) => Date.parse(d.startTime) > Date.now())
            .filter((d) => isTutor || d.isVisible)
            .map((d, index) => <QueueCard isTutor={isTutor} queueId={d.queueId} key={index} title={d.title} location={[]} courseAdmins={d.courseAdmins} isEdit={d.isEdit}/>)}
          {data
            .filter((d) => Date.parse(d.startTime) > Date.now())
            .filter((d) => isTutor || d.isVisible)
            .length === 0 && <p>No upcoming queues</p>}
        </div>
        <h1 className={styles.heading}>Previous</h1>
        <div className={styles.cards}>
          {data
            .filter((d) => Date.parse(d.endTime) < Date.now())
            .filter((d) => isTutor || d.isVisible)
            .map((d, index) => <QueueCard isPrevious={true} isTutor={isTutor} queueId={d.queueId} key={index} title={d.title} location={[]} courseAdmins={d.courseAdmins} seen={d.seen} unseen={d.unseen}/> )}
          {data
            .filter((d) => Date.parse(d.endTime) < Date.now())
            .filter((d) => isTutor || d.isVisible)
            .length === 0 && <p>No previous queues</p>}
        </div>
      </div>
    </>
  );
};

export default ViewQueue;
