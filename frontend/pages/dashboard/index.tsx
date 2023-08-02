import { NextPage } from 'next/types';
import styles from './Dashboard.module.css';
import JoinTutorModal from '../../components/JoinTutorModal';
import CourseOfferingCard from '../../components/CourseOfferingCard';
import CourseCard from '../../components/CourseCard';
import Header from '../../components/Header';
import MetaData from '../../components/MetaData';
import CreateCourseOfferingModal from '../../components/CreateCourseOfferingModal';
import React, { useEffect, useState } from 'react';
import { authenticatedGetFetch, toCamelCase } from '../../utils';
import { CourseOfferingData } from '../../types/courses';
import { UserProfile } from '../../types/profile';

const Dashboard: NextPage = () => {
  const [courseOfferings, setCourseOfferings] = useState<CourseOfferingData[]>([]);
  const [myCourses, setMyCourses] = useState<CourseOfferingData[]>([]);
  const [myProfile, setMyProfile ] = useState<UserProfile | undefined>(undefined);
  useEffect(() => {
    const fetchCourseOfferings = async () => {
      let res = await authenticatedGetFetch('/course/list', {});
      if (!res.ok) {
        console.error('authentication failed, or something broke, check network tab');
        return;
      }
      let courseOfferings = await res.json();
      setCourseOfferings(toCamelCase(courseOfferings));
    };

    const fetchCoursesTutored = async () => {
      let res = await authenticatedGetFetch('/course/get_tutored', {});
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
        
          <>
            { myProfile?.isOrgAdmin &&
              <div className={styles.courseOffering}>
                <h1 className={styles.heading}>Select course offering</h1>
                <CreateCourseOfferingModal />
              </div>
            }
            <div className={styles.cards}>
              {courseOfferings?.filter((offering) => myProfile?.courseAdmin.map((t) => t.courseCode).includes(offering.courseCode)).map(d => (
                <CourseOfferingCard
                  key={d.courseOfferingId}
                  title={`${d.courseCode} - ${d.title}`}
                  inviteCode={d.tutorInviteCode}
                  courseOfferingId={d.courseOfferingId}
                />
              ))}
            </div>
          </>
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
            <h1>Courses you are a student of</h1>
            <p>Select a course to view queues</p>
            <div className={styles.cards}>
              {courseOfferings
                ?.filter(
                  (course) => myCourses.every((item) => item.courseOfferingId !== course.courseOfferingId)
                )
                .map((d, index) => (
                  <CourseCard key={index} title={d.title} index={d.courseOfferingId}/>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
