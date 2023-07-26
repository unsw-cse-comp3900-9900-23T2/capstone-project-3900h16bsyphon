import router from 'next/router';
import { useEffect, useState } from 'react';
import QueueCard from '../../../components/QueueCard';
import { authenticatedGetFetch, toCamelCase } from '../../../utils';
import styles from './CourseAnalytics.module.css';
import Header from '../../../components/Header';
import MetaData from '../../../components/MetaData';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import AnalyticsChart from '../../../components/Chart';

const CourseAnalytics = () => {
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
      const res = await authenticatedGetFetch('/queue/get_by_course', {
        course_id: `${router.query.courseid}`,
      });
      let d = await res.json();
      setData(toCamelCase(d));
    };
    let getCourse = async () => {
      if (!router.query.courseid) return;
      const res = await authenticatedGetFetch('/course/get', {course_id: `${router.query.courseid}`});
      let d = await res.json();
      setCourseData(toCamelCase(d));
    };
    // TODO: replace with courses/get course admins route
    let getTutored = async () => {
      const res = await authenticatedGetFetch('/course/get_tutored', {course_id: `${router.query.courseid}`});
      let d = await res.json();
      setIsTutor(
        toCamelCase(d).some((course: {courseCode: string}) => course.courseCode === courseData.courseCode)
      );
    };
    getQueues();
    getCourse();
    getTutored();
  }, [courseData.courseCode]);

  return (
    <>
      <MetaData />
      <Header />
      <div className={styles.analyticsContainer}>
        <h1 className={styles.text}>Course analytics dashboard</h1>
        <div className={styles.statsContainer}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar />
          </LocalizationProvider>
          <div className={styles.analytics}>
            <AnalyticsChart />
            <AnalyticsChart />
            <AnalyticsChart />
          </div>
        </div>
        <div className={styles.queuesContainer}>
          <h1>Past queues</h1>
          <div className={styles.cards}>
            {data
              .filter((d) => Date.parse(d.endTime) < Date.now())
              .filter((d) => isTutor || d.isVisible)
              .map((d, index) => (
                <QueueCard
                  isPrevious={true}
                  isTutor={isTutor} 
                  queueId={d.queueId}
                  key={index}
                  title={d.title}
                  location={[]}
                  courseAdmins={d.courseAdmins}
                  seen={d.seen}
                  unseen={d.unseen}
                />
              ))}
            {data
              .filter((d) => Date.parse(d.endTime) < Date.now())
              .filter((d) => isTutor || d.isVisible).length === 0 && (
              <p>No previous queues</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseAnalytics;
