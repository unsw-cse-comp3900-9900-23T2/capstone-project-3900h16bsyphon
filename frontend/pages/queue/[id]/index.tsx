import MetaData from '../../../components/MetaData';
import Header from '../../../components/Header';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import styles from './ViewQueue.module.css';
import QueueCard from '../../../components/QueueCard';
import Typography from '@mui/material/Typography';
import Footer from '../../../components/Footer';

const data = [
  {
    title: 'COMP1000 Week 3 Friday 16:00-18:00 Help Session',
    seen: 5,
    unseen: 4,
    location: ['Brass Lab', 'Online'],
    courseAdmins: ['Hussain', 'Peter'],
    isEdit: true,
  },
  {
    title: 'COMP1000 Week 3 Friday 16:00-18:00 Help Session',
    seen: 5,
    unseen: 4,
    location: ['Brass Lab', 'Online'],
    courseAdmins: ['Hussain', 'Peter'],
    isEdit: true,
  },
  {
    title: 'COMP1000 Week 3 Friday 16:00-18:00 Help Session',
    seen: 5,
    unseen: 4,
    location: ['Brass Lab', 'Online'],
    courseAdmins: ['Hussain', 'Peter'],
    isEdit: true,
  }
];

const ViewQueue = () => {
  return (
    <>
      <MetaData />
      <Header />
      <div className={styles.container}>
        <Typography variant="h3" className={styles.title}>COMP1000: 23T2</Typography>
        <div className={styles.section}>
          <h1 className={styles.heading}>Live</h1>
          <Button startIcon={<AddIcon />} className={styles.newQueueBtn}>New Queue</Button>
        </div>
        <div className={styles.cards}>
          {data.map((d, index) => (
            <QueueCard key={index} title={d.title} location={d.location} courseAdmins={d.courseAdmins} isEdit={d.isEdit} seen={d.seen} unseen={d.unseen}/>
          ))}
        </div>
        <div className={styles.section}>
          <h1 className={styles.title}>Upcoming</h1>
        </div>
        <div className={styles.cards}>
          {data.map((d, index) => <QueueCard key={index} title={d.title} location={d.location} courseAdmins={d.courseAdmins} isEdit={d.isEdit}/>)}
        </div>
        <div className={styles.section}>
          <h1 className={styles.title}>Previous</h1>
        </div>
        <div className={styles.cards}>
          {data.map((d, index) => <QueueCard key={index} title={d.title} location={d.location} courseAdmins={d.courseAdmins} seen={d.seen} unseen={d.unseen}/> )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ViewQueue;
