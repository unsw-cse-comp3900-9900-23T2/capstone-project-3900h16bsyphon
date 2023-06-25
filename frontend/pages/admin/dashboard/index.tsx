import { NextPage } from 'next/types';
import Head from 'next/head';
import JoinTutorModal from '../../../components/JoinTutorModal';
import styles from './AdminDashboard.module.css';

const AdminDashboard: NextPage = () => {
  return (
    <div className={styles.dashboard}>
      <Head>
        <title>Syphon</title>
        <meta name='description' content='A fountain of knowledge to syphon off for yourself 😎' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <h1>Select course offering</h1>
      {/* TODO: insert course card */}
      <h1>Courses you tutor</h1>
      <div className={styles.coursesTutor}>
        <p>Select a course to view queries</p>
        <JoinTutorModal />
      </div>
      <h1>Courses on Syphon</h1>
      <p>Select a course to view queues</p>
    </div>
  );
};

export default AdminDashboard;
