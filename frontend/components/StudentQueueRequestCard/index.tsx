import { Button, Card, CardActionArea, CardActions, Typography } from '@mui/material';
import styles from './StudentQueueRequestCard.module.css';
import { useRouter } from 'next/router';
import TagBox from '../TagBox';
import { useEffect, useState } from 'react';
import { authenticatedGetFetch, formatZid } from '../../utils';
import type { Tag } from '../../types/requests';

type StudentQueueRequestCardProps = {
  zid: number,
  firstName: string,
  lastName: string,
  title: string,
  tags: Tag[],
  requestId: number,
  status: string,
  queueId?: string,
}

const StudentQueueRequestCard = ({ zid, firstName, lastName, title, tags, requestId, status, queueId }: StudentQueueRequestCardProps) => {
  const router = useRouter();

  const determineBackgroundColor = ( status: string ) => {
    // TOOD: standardize these request status 
    switch (status) {
    case 'Resolved':
      return '#EDFFEE';
    case 'Unresolved':
      return 'white';
    case 'In Progress':
      return '#E3F0FC';
    case 'Not Found':
      return '#F8E9E9';
    default:
      return 'white';
    }
  };

  const [backgroundColor, setBackgroundColor] = useState(determineBackgroundColor(status));
  const [previousRequests, setPreviousRequests] = useState(0);
  const handleNotFound = () => {
    // TODO: implement properly in the next sprint
    setBackgroundColor(determineBackgroundColor('Not Found'));
  };

  const handleResolve = () => {
    // TODO: implement properly in the next sprint
    setBackgroundColor(determineBackgroundColor('Resolve'));
  };

  useEffect(() => {
    const findRequests = async () => {
      const res = await authenticatedGetFetch('/history/request_count', {
        zid: zid.toString(),
        queue_id: queueId as string
      });
      const value = await res.json();
      setPreviousRequests(value.count);
    };
    if (!queueId) return;
    findRequests();
  }, [queueId, zid]);

  return <>
    <Card className={styles.card} style={{ backgroundColor }}>
      <CardActionArea className={styles.cardContent} onClick={() => router.push(`/request/${requestId}`)}>
        <div className={styles.cardHeader}>
          <div className={styles.zidNameContainer}>
            <TagBox text={formatZid(zid)} backgroundColor='#D5CFFF' color='#3E368F' />
            <Typography className={styles.textHeading} variant='h6'>
              {firstName + ' ' + lastName}
            </Typography>
          </div>
          <div className={styles.previousRequestsContainer}>
            <TagBox text={`PREVIOUS TOTAL REQUESTS: ${previousRequests - 1}`} backgroundColor='#D5CFFF' color='#3E368F' />
          </div>
        </div>
        <div className={styles.titleContainer}>
          <Typography className={styles.textHeading} variant='h6'>
            {title}
          </Typography>
        </div>
        <div className={styles.tagContainer}>
          {tags?.map((tag, i) => {
            return <TagBox text={tag.name} key={i} isPriority={tag.isPriority} backgroundColor='#EDB549' color='white' />;
          })}
        </div>
        <CardActions className={styles.cardActions}>
          {(status === 'Unresolved') && <Button className={styles.claimButton} variant='contained' onClick={() => router.push('/wait/1')}>
          Claim
          </Button>}
          {(status === 'In Progress') && <Button className={styles.claimButton} variant='contained' onClick={handleResolve}>
          Resolve
          </Button>}
          {(status === 'Unresolved') && <Button className={styles.notFoundButton} variant='contained' onClick={handleNotFound} >
          Not Found
          </Button>}
        </CardActions>
      </CardActionArea>
    </Card>
  
  </>;
};

export default StudentQueueRequestCard;
