import { useRouter } from 'next/router';
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
import AnalyticsBarChart from '../../../components/AnalyticsBarChart';
import { AnalyticsWaitTimeData } from '../../../types/courses';

const CourseAnalytics = () => {
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
  const [courseData, setCourseData] = useState<any>({ title: 'COMP1000' });
  const [isTutor, setIsTutor] = useState(false);
  const [waitTimeAnalytics, setWaitTimeAnalytics] =
    useState<AnalyticsWaitTimeData>();

  useEffect(() => {
    const getQueues = async () => {
      if (!router.query.courseid) return;
      const res = await authenticatedGetFetch('/queue/get_by_course', {
        course_id: `${router.query.courseid}`,
      });
      const d = await res.json();
      setData(toCamelCase(d));
    };
    const getCourse = async () => {
      if (!router.query.courseid) return;
      const res = await authenticatedGetFetch('/course/get', {
        course_id: `${router.query.courseid}`,
      });
      const d = await res.json();
      setCourseData(toCamelCase(d));
    };
    // TODO: replace with courses/get course admins route
    const getTutored = async () => {
      const res = await authenticatedGetFetch('/course/get_tutored', {
        course_id: `${router.query.courseid}`,
      });
      const d = await res.json();
      setIsTutor(
        toCamelCase(d).some(
          (course: { courseCode: string }) =>
            course.courseCode === courseData.courseCode
        )
      );
    };
    const getWaitTimeAnalytics = async () => {
      if (!router.query.courseid) return;
      const res = await authenticatedGetFetch('/course/wait_time_analytics', {
        course_id: `${router.query.courseid}`,
      });
      if (!res.ok) {
        console.log('something went wrong with wait time analytics request, check network tab');
        return;
      }
      const d = await res.json();
      setWaitTimeAnalytics(toCamelCase(d));
      console.log('wwai time analutocs data ', d);
    };
    getQueues();
    getCourse();
    getTutored();
    getWaitTimeAnalytics();
  }, [courseData.courseCode, router.query.courseid]);

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
            <AnalyticsBarChart
              data={{
                labels: waitTimeAnalytics?.waitTimes.map(x => x.fullName),
                datasets: [{
                  label: 'mins',
                  data: waitTimeAnalytics ? waitTimeAnalytics.waitTimes.map(x => x.averageWait) : [],
                  backgroundColor: '#D5CFFF', // doesn't let me use global css vars here
                }],
              }}
              chartTitle={'Average Tutor Wait Times'}
            />
          </div>
        </div>
        <div className={styles.queuesContainer}>
          <h1>Current queues</h1>
          <div className={styles.cards}>
            {data
              .filter(
                (d) =>
                  Date.parse(d.startTime) < Date.now() &&
                  Date.parse(d.endTime) > Date.now()
              )
              .filter((d) => isTutor || d.isVisible)
              .map((d, index) => (
                <QueueCard
                  isQueueAnalyticsLive
                  isTutor={isTutor}
                  queueId={d.queueId}
                  key={index}
                  title={d.title}
                  location={[]}
                  courseAdmins={d.courseAdmins}
                  isEdit={d.isEdit}
                />
              ))}
            {data
              .filter(
                (d) =>
                  Date.parse(d.startTime) < Date.now() &&
                  Date.parse(d.endTime) > Date.now()
              )
              .filter((d) => isTutor || d.isVisible).length === 0 && (
              <p>No live queues</p>
            )}
          </div>
          <h1>Past queues</h1>
          <div className={styles.cards}>
            {data
              .filter((d) => Date.parse(d.endTime) < Date.now())
              .filter((d) => isTutor || d.isVisible)
              .map((d, index) => (
                <QueueCard
                  isPrevious
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
