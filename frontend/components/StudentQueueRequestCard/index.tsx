import { Button, Card, CardActionArea, CardActions, IconButton, Typography } from '@mui/material';
import styles from './StudentQueueRequestCard.module.css';
import { useRouter } from 'next/router';
import TagBox from '../TagBox';
import { useEffect, useState } from 'react';
import { authenticatedGetFetch, formatZid } from '../../utils';
import { Status, Tag } from '../../types/requests';
import { ArrowDownward, ArrowUpward } from '@mui/icons-material';

type StudentQueueRequestCardProps = {
  zid: number,
  firstName: string,
  lastName: string,
  title: string,
  tags: Tag[],
  requestId: number,
  status: Status,
  queueId?: string,
}

const StudentQueueRequestCard = ({ zid, firstName, lastName, title, tags, requestId, status, queueId }: StudentQueueRequestCardProps) => {
  const router = useRouter();

  const determineBackgroundColor = (status: Status) => {
    switch (status) {
    case Status.Seen:
      return '#EDFFEE';
    case Status.Unseen:
      return 'white';
    case Status.Seeing:
      return '#E3F0FC';
    case Status.NotFound:
      return '#F8E9E9';
    default:
      return 'white';
    }
  };


  const [backgroundColor, setBackgroundColor] = useState(determineBackgroundColor(status));
  const [previousRequests, setPreviousRequests] = useState(0);
  const handleNotFound = () => {
    // TODO: implement properly in the next sprint
    setBackgroundColor(determineBackgroundColor(Status.NotFound));
  };

  const handleResolve = () => {
    // TODO: implement properly in the next sprint
    setBackgroundColor(determineBackgroundColor(Status.Seen));
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
            <TagBox text={`PREVIOUS TOTAL REQUESTS: ${previousRequests}`} backgroundColor='#D5CFFF' color='#3E368F' />
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
          <div className={styles.orderContainer}>
            <IconButton aria-label="move up button"><ArrowUpward /></IconButton>
            <IconButton aria-label="move down button"><ArrowDownward /></IconButton>
          </div>
          {/* TODO: unhardcode */}
          {(status === Status.Unseen) && <Button className={styles.claimButton} variant='contained' onClick={() => router.push('/wait/1')}>
          Claim
          </Button>}
          {(status === Status.Seeing) && <Button className={styles.claimButton} variant='contained' onClick={handleResolve}>
          Resolve
          </Button>}
          {(status === Status.Unseen) && <Button className={styles.notFoundButton} variant='contained' onClick={handleNotFound} >
          Not Found
          </Button>}
        </CardActions>
      </CardActionArea>
    </Card>
  
  </>;
};

export default StudentQueueRequestCard;
