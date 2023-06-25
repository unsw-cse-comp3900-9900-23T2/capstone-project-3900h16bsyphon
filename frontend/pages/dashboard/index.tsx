import { NextPage } from 'next/types';
import Head from 'next/head';
import styles from './Dashboard.module.css';
import JoinTutorModal from '../../components/JoinTutorModal';
import CourseCard from '../../components/CourseCard';

const data = [
  {
    title: 'COMP1531 - javascript backend course',
    code: 'uwu123',
  },
  {
    title: 'COMP3900 - uwu project course',
    code: 'uwu123',
  },
  {
    title: 'COMP2511 - software art course',
    code: 'uwu123',
  }
];

const Dashboard: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Syphon</title>
        <meta name='description' content='A fountain of knowledge to syphon off for yourself 😎' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <div className={styles.dashboard}>
        <h1>Select course offering</h1>
        <div className={styles.cards}>
          {data.map((d, index) => (
            <CourseCard key={index} title={d.title} code={d.code}/>
          ))}
        </div>
        <h1>Courses you tutor</h1>
        <div className={styles.coursesTutor}>
          <p>You are not a tutor for any courses.</p>
          <JoinTutorModal />
        </div>
        <h1>Courses you are a student</h1>
        <p>Select a course to view queues</p>
      </div>
    </div>
  );
};

export default Dashboard;
