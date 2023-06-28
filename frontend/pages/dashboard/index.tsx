import { NextPage } from 'next/types';
import styles from './Dashboard.module.css';
import JoinTutorModal from '../../components/JoinTutorModal';
import CourseOfferingCard from '../../components/CourseOfferingCard';
import CourseCard from '../../components/CourseCard';
import Header from '../../components/Header';
import MetaData from '../../components/MetaData';
import Footer from '../../components/Footer';
import CreateCourseOfferingModal from '../../components/CreateCourseOfferingModal';
import React, { useEffect, useState } from 'react';
import { authenticatedGetFetch } from '../../utils';

type CourseOffering = {
  title: string;
  courseCode: string;
  startDate: string;
  courseOfferingId: number;
  tutorInviteCode: string;
}

const Dashboard: NextPage = () => {
  const [data, setData] = useState<CourseOffering[]>([]);
  useEffect(() => {
    const fetchCourseOfferings = async () => {
      let res = await authenticatedGetFetch('/course/list', {});
      if (!res.ok) {
        console.error('authentication failed, or something broke, check network tab');
        return;
      }
      let data = await res.json();
      setData(data.map((course: any) => (
        {
          title: course.title,
          courseCode: course.course_code,
          startDate: course.start_date,
          courseOfferingId: course.course_offering_id,
          tutorInviteCode: course.tutor_invite_code
        }
      )));
    };
    fetchCourseOfferings();
  }, []);

  return (
    <>
      <MetaData />
      <Header />
      <div className={styles.container}>
        <div className={styles.dashboard}>
          <div className={styles.courseOffering}>
            <h1 className={styles.heading}>Select course offering</h1>
            <CreateCourseOfferingModal />
          </div>
          <div className={styles.cards}>
            {data.map((d, index) => (
              <CourseOfferingCard key={index} title={`${d.courseCode} - ${d.title}`} inviteCode={d.tutorInviteCode}/>
            ))}
          </div>
          <div className={styles.tutorSection}>
            <h1>Courses you tutor</h1>
            <div className={styles.section}>
              <p>Select a course to manage queues</p>
              <JoinTutorModal />
            </div>
            <div className={styles.cards}>
              {data.map((d, index) => (
                <CourseCard title={d.title} key={index} index={index}/>
              ))}
            </div>
          </div>
          <div className={styles.studentSection}>
            <h1>Courses you are a student</h1>
            <p>Select a course to view queues</p>
            <div className={styles.cards}>
              {data.map((d, index) => (
                <CourseCard key={index} title={d.title} index={index}/>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Dashboard;
