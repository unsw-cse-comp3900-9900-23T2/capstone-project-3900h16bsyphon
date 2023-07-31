import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import QueueCard from '../../../components/QueueCard';
import { authenticatedGetFetch, toCamelCase } from '../../../utils';
import styles from './CourseAnalytics.module.css';
import Header from '../../../components/Header';
import MetaData from '../../../components/MetaData';
import { AnalyticsWaitTimeData, TagAnalytics } from '../../../types/courses';
import { Button, Typography } from '@mui/material';
import AnalyticsChartCarousel from '../../../components/AnalyticsChartCarousel';
import AnalyticsCalendar from '../../../components/AnalyticsCalendar';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import SyphonTimePicker from '../../../components/SyphonTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { utcToZonedTime, format } from 'date-fns-tz';

const CourseAnalytics = () => {
  const router = useRouter();
  const pastMonth = new Date();
  const [startTime, setTimeStart] = useState<Dayjs>(dayjs(new Date()));
  const [endTime, setTimeEnd] = useState<Dayjs>(dayjs(new Date()).add(2, 'hour'));
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
  const [tagAnalytics, setTagAnalytics] = useState<TagAnalytics>();
  const defaultSelected: DateRange = {
    from: pastMonth,
    to: addDays(pastMonth, 4)
  };
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultSelected);

  const handleRangeChange = (newRange: DateRange | undefined) => setDateRange(newRange);

  const parseTags = (d: TagAnalytics) => {
    const tagAnalytics = d.reduce((accumulator, tag) => {
      const { name, requestIds } = tag;
      if (accumulator.has(name)) {
        // if the name is already in the map, merge the request ids
        const existingTag = accumulator.get(name);
        existingTag.requestIds.push(...requestIds);
      } else {
        // if the name is not found, add the tag to the map
        accumulator.set(name, { ...tag, requestIds: [...requestIds] });
      }
      return accumulator;
    }, new Map());
    return Array.from(tagAnalytics.values());
  };

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
        console.log(
          'something went wrong with wait time analytics request, check network tab'
        );
        return;
      }
      const d = await res.json();
      setWaitTimeAnalytics(toCamelCase(d));
    };
    const getTagAnalytics = async () => {
      if (!router.query.courseid) return;
      const res = await authenticatedGetFetch('/course/get_tag_analytics', {
        course_offering_id: `${router.query.courseid}`,
      });
      const d = await res.json();
      setTagAnalytics((parseTags(toCamelCase(d))));
    };
    getQueues();
    getCourse();
    getTutored();
    getWaitTimeAnalytics();
    getTagAnalytics();
  }, [courseData.courseCode, router.query.courseid, dateRange, startTime, endTime]);

  // const timeZone = 'Australia/Sydney';
  // const convertDateRange = (date: any) => {
  //   const newDate = Date.parse(date);
  //   return format(utcToZonedTime(newDate, timeZone), 'yyyy-MM-dd\'T\'HH:mm:ss', { timeZone });
  // };
  
  const handleSubmit = async () => {
    // console.log(convertDateRange(dateRange?.from));
    // console.log(convertDateRange(dateRange?.to));
    console.log(startTime.format('YYYY-MM-DDTHH:mm:ss'));
    console.log(endTime.format('YYYY-MM-DDTHH:mm:ss'));
    console.log(router.query.courseid);
  };
  
  return (
    <>
      <MetaData />
      <Header />
      <div className={styles.pageContainer}>
        <div className={styles.queueTitle}>
          <Typography variant="h3">{courseData.courseCode} Analytics</Typography>
        </div>
        <div className={styles.body}>
          <div className={styles.buttonContainer}>
            <Button
              className={styles.greyButton}
              variant="contained"
              onClick={() => router.back()}
            >
              Back
            </Button>
          </div>
          <div className={styles.courseAnalyticsContent}>
            <div className={styles.statsContainer}>
              <div className={styles.calendarContainer}>
                <AnalyticsCalendar range={dateRange} onRangeChange={handleRangeChange} />
                { dateRange?.from !== undefined && dateRange?.to === undefined && <div className={styles.timePickerContainer}>
                  <Typography>Enter start and end time</Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <SyphonTimePicker 
                      timeStart={startTime} 
                      setTimeStart={setTimeStart} 
                      timeEnd={endTime} 
                      setTimeEnd={setTimeEnd} 
                    />
                  </LocalizationProvider>
                </div>}
                <Button onClick={handleSubmit} className={styles.submitBtn}>Submit</Button>
              </div>
              <div className={styles.chartCarouselContainer}>
                <AnalyticsChartCarousel waitTimeAnalytics={waitTimeAnalytics} tagAnalytics={tagAnalytics} range={dateRange} startTime={startTime} endTime={endTime} />
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
        </div>
      </div>
    </>
  );
};

export default CourseAnalytics;
