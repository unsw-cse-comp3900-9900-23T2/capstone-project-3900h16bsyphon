import { NextPage } from 'next/types';
import styles from './Dashboard.module.css';
import JoinTutorModal from '../../components/JoinTutorModal';
import CourseOfferingCard from '../../components/CourseOfferingCard';
import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import CourseCard from '../../components/CourseCard';
import Header from '../../components/Header';
import MetaData from '../../components/MetaData';
import Footer from '../../components/Footer';

const data = [
  {
    title: 'COMP1531 - javascript backend course',
  },
  {
    title: 'COMP3900 - project course',
  },
  {
    title: 'COMP2511 - software art course',
  }
];

const Dashboard: NextPage = () => {
  return (
    <div className={styles.container}>
      <MetaData />
      <Header />
      <div className={styles.dashboard}>
        <div className={styles.courseOffering}>
          <h1 className={styles.heading}>Select course offering</h1>
          <Button startIcon={<AddIcon />} className={styles.createOfferingBtn}>Create Offering</Button>
        </div>
        <div className={styles.cards}>
          {data.map((d, index) => (
            <CourseOfferingCard key={index} title={d.title} />
          ))}
        </div>
        <div className={styles.tutorSection}>
          <h1>Courses you tutor</h1>
          <div className={styles.section}>
            <p>You are not a tutor for any courses.</p>
            <JoinTutorModal />
          </div>
        </div>
        <div className={styles.studentSection}>
          <h1>Courses you are a student</h1>
          <p>Select a course to view queues</p>
          <div className={styles.cards}>
            {data.map((d, index) => (
              <CourseCard key={index} title={d.title} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;