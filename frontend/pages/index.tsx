import type { NextPage } from 'next';
import Head from 'next/head';
import styles from './Home.module.css';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Image from 'next/image';
import FeatureGrid from '../components/FeatureGrid';
const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Syphon</title>
        <meta name="description" content="A fountain of knowledge to syphon off for yourself 😎" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <Logo />
          <div className={styles.side}>
            <Button> Sign up </Button>
            <Button variant='contained'> Log in </Button>
          </div>
        </div>
        <h1 className={styles.title}>Syphon</h1>
        <p className={styles.description}> A help session management tool for course admins, students and tutors!</p>
        <div className={styles.offerings}>
          <div className={styles.offeringsBody}>
            <h2 className={styles.whatWeOffer}> What we offer </h2>
            <p className={styles.whatWeOfferDescription}>
              Syphon is a virtual queue system which allows
              for tickets to be cut against queues generated by tutors,
              who are answering student queries.
              This system is specialised for helping students find happy tutors to answer their burning questions for their assignments!
              Syphon allows you to also look through questions that other students have submitted, so you can tag yourself to other questions
              when you have the same question.
            </p>
            <div className={styles.featureGrid}>
              <FeatureGrid
                title='Queue Management'
                svgLoc='/images/queueIcon.svg'
                description='High level management of the creation, editing and deletion of queues and help session requests.'
              />
              <FeatureGrid
                title='User History'
                svgLoc='/images/userHistory.svg'
                description='Filtering through users is annoying as a tutor, so Syphon lets you see student’s past tickets for that course and priority sort to encourage students to attend their labs rather than help sessions.'
              />
              <FeatureGrid
                title='Queue Request Management'
                svgLoc='/images/requestIcon.svg'
                description='The tools required by students and tutors to manage requests.'
              />
              <FeatureGrid
                title='Waiting Screen'
                svgLoc='/images/waitingIcon.svg'
                description='Confused on what’s going with the help session? A waiting screen is presented for students in queue so that we’re not left in the dark.'
              />
            </div>
          </div>
          <div className={styles.homeImage}>
            <Image width="597px" height="580px" src='/Home/homeGraphic.png' alt="woman sorting requests into a virtual set of queues"/>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
