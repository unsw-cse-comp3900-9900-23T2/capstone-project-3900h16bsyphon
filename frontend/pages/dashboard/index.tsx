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
import { authenticatedGetFetch, toCamelCase } from '../../utils';
import { CourseOfferingData } from '../../types/courses';

type CourseOffering = {
  title: string;
  courseCode: string;
  startDate: string;
  courseOfferingId: number;
  tutorInviteCode: string;
}

const Dashboard: NextPage = () => {
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [myCourses, setMyCourses] = useState<CourseOffering[]>([]);
  const [myProfile, setMyProfile ] = useState<any>({});
  useEffect(() => {
    const fetchCourseOfferings = async () => {
      let res = await authenticatedGetFetch('/course/list', {});
      if (!res.ok) {
        console.error('authentication failed, or something broke, check network tab');
        return;
      }
      let courseOfferings = await res.json();
      setCourseOfferings(courseOfferings?.map((course: CourseOfferingData) => (
        {
          title: course.title,
          courseCode: course.course_code,
          startDate: course.start_date,
          courseOfferingId: course.course_offering_id,
          tutorInviteCode: course.tutor_invite_code
        }
      )));
    };

    const fetchCoursesTutored = async () => {
      let res = await authenticatedGetFetch('/courses/get_tutored', {});
      if (!res.ok) {
        console.error('authentication failed, or something broke, check network tab');
        return;
      }
      let courses = await res.json() as any;
      setMyCourses(toCamelCase(courses));
    };
    const fetchUserProfile = async () => {
      const res = await authenticatedGetFetch('/user/profile', {});
      if (!res.ok) {
        console.error('authentication failed, or something broke, check network tab');
        return;
      }
      setMyProfile(toCamelCase(await res.json()));
    };
    fetchCoursesTutored();
    fetchCourseOfferings();
    fetchUserProfile();
  }, []);

  return (
    <>
      <MetaData />
      <Header />
      <div className={styles.container}>
        <div className={styles.dashboard}>
          { myProfile.isOrgAdmin &&
            <>
              <div className={styles.courseOffering}>
                <h1 className={styles.heading}>Select course offering</h1>
                <CreateCourseOfferingModal />
              </div><div className={styles.cards}>
                {courseOfferings?.map((d, index) => (
                  <CourseOfferingCard key={index} title={`${d.courseCode} - ${d.title}`} inviteCode={d.tutorInviteCode} index={index}/>
                ))}
              </div>
            </>
          }
          <div className={styles.tutorSection}>
            <h1>Courses you tutor</h1>
            <div className={styles.section}>
              <p>Select a course to manage queues</p>
              <JoinTutorModal />
            </div>
            <div className={styles.cards}>
              {myCourses?.map((d, index) => (
                <CourseCard title={d.title} key={index} index={d.courseOfferingId}/>
              ))}
            </div>
          </div>
          <div className={styles.studentSection}>
            <h1>Courses you are a student</h1>
            <p>Select a course to view queues</p>
            <div className={styles.cards}>
              {courseOfferings?.map((d, index) => (
                <CourseCard key={index} title={d.title} index={d.courseOfferingId}/>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;
