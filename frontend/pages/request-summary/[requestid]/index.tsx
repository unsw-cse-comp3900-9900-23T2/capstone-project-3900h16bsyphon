import { Box, Button, Card, Typography } from '@mui/material';
import Header from '../../../components/Header';
import styles from './RequestSummary.module.css';
import StudentRequestCard from '../../../components/StudentRequestCard';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { authenticatedGetFetch, formatZid, toCamelCase, changeBackgroundColour, changeTextColour, convertTime } from '../../../utils';
import { Status, UserRequestSummary } from '../../../types/requests';
import TagBox from '../../../components/TagBox';

const RequestSummary = () => {
  const router = useRouter();
  const [requestData, setData] = useState({
    zid: 5303033,
    queueTitle: 'COMP1521 Thursday Week 5 Help Session',
    firstName: 'Jane',
    lastName: 'Doe',
    status: Status.Unseen,
    title: 'Pls help me with printing this array - im so stuck!',
    queueId: 1,
    courseOfferingId: 1,
    tags: [{
      name: 'tag',
      isPriority: false,
      tagId: 1,
    }],
    isClusterable: false,
    previousRequests: 5,
    description:''  
  });

  const [requestSummary, setRequestSummary] = useState<UserRequestSummary>({
    tutors: [],
    startTime: { eventTime: '' as unknown as Date},
    endTime: { eventTime: '' as unknown as Date},
    duration: { hours: 0, minutes: 0, seconds: 0 }
  });

  useEffect(() => {
    const getRequest = async () => {
      const res: Response = await authenticatedGetFetch('/request/get_info', {request_id: `${router.query.requestid}`});
      if (res.status === 404) {
        router.push('/404');
      } else if (res.status === 403) {
        router.push('/403');
      } else if (res.status === 200) {
        const d = await res.json();
        setData(toCamelCase(d));
      }
    };
    const getRequestSummary = async () => {
      const res: Response = await authenticatedGetFetch('/request/summary', {request_id: `${router.query.requestid}`});
      if (!res.ok) {
        console.log('something failed with getting request summary, check network tab');
        return;
      } 
      const d = await res.json();
      setRequestSummary(toCamelCase(d));
    };
    if (!router.query.requestid) return;
    getRequest();
    getRequestSummary();
  }, [router.query.requestid]);

  const getDurationString = () => {
    return 'Duration: ' + requestSummary.duration?.hours.toString() + ' hours ' + requestSummary.duration?.minutes.toString() + ' mins ' + requestSummary.duration?.seconds.toString() + ' seconds';
  };

  return (
    <>
      <Header />
      <div className={styles.pageContainer}>
        <div className={styles.queueTitle}>
          <Typography variant='h3'>
            {requestData.queueTitle}
          </Typography>
        </div>
        <div className={styles.body}>
          <div className={styles.buttonContainer}>
            <Button className={styles.greyButton} variant='contained' onClick={() => router.push(`/active-queue/${requestData.queueId}`)}>Back</Button>
            <Button className={styles.greyButton} variant='contained' onClick={() => router.push('/dashboard')}>Dashboard</Button>
          </div>
          <Box className={styles.cardBox}>
            <StudentRequestCard
              zid={requestData.zid}
              status={requestData.status}
              firstName={requestData.firstName}
              lastName={requestData.lastName}
              tags={requestData.tags}
              title={requestData.title}
              previousRequests={requestData.previousRequests}
              description={requestData.description}
            />
          </Box>
          <div className={styles.summaryContainer}>
            <Card className={styles.infoCard}>
              <Typography className={styles.summaryHeadings} variant='h6'>Tutors Involved</Typography>
              <div className={styles.tutorIdNameContainer}>
                {/* if there is no start time, request was resolved by student */}
                {!requestSummary.startTime &&
                  <div className={styles.tutorIdNameContainer}>
                    <Typography className={styles.summaryHeadings} variant='body1'>Request was resolved by student</Typography>
                  </div>
                }
                {requestSummary.tutors.map((tutor) => {
                  return <div className={styles.tutorIdName} key={tutor.zid}>
                    <TagBox
                      text={formatZid(tutor.zid)}
                      backgroundColor="var(--colour-main-purple-400)"
                      color="var(--colour-main-purple-900)"
                    />
                    <Typography variant='body1'>{tutor.firstName + ' ' + tutor.lastName}</Typography>
                  </div>;
                })}
              </div>
            </Card>
            <Card className={styles.infoCard}>
              <Typography className={styles.summaryHeadings}  variant='h6'>Time Summary</Typography>
              <div className={styles.tutorIdNameContainer}>
                <div className={styles.tutorIdName} >
                  {requestSummary.startTime &&
                    <>
                      <Typography className={styles.summaryHeadings} variant='body1'>Start Time:</Typography>
                      <Typography variant='body1'>{convertTime(requestSummary.startTime?.eventTime)}</Typography>
                    </>
                  }
                </div>
                <div className={styles.tutorIdName} >
                  <Typography className={styles.summaryHeadings} variant='body1'>End Time:</Typography>
                  <Typography variant='body1'>{convertTime(requestSummary.endTime.eventTime)}</Typography>
                </div>
                {/* dont display duration if request was resolved by student */}
                {requestSummary.startTime &&
                  <div className={styles.durationTagBoxContainer}>
                    <TagBox
                      text={getDurationString()}
                      backgroundColor={changeBackgroundColour(requestSummary.duration)}
                      color={changeTextColour(requestSummary.duration)}
                    />
                  </div>}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestSummary;
