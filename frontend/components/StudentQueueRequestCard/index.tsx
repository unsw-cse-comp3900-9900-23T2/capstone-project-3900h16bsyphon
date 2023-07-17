import { Button, Card, CardActionArea, CardActions, IconButton, Typography } from '@mui/material';
import styles from './StudentQueueRequestCard.module.css';
import { useRouter } from 'next/router';
import TagBox from '../TagBox';
import { useState } from 'react';
import { formatZid } from '../../utils';
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
  previousRequests: number,
}

const StudentQueueRequestCard = ({ zid, firstName, lastName, title, tags, requestId, status, previousRequests }: StudentQueueRequestCardProps) => {
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
  const handleNotFound = () => {
    // TODO: implement properly in the next sprint
    setBackgroundColor(determineBackgroundColor(Status.NotFound));
  };

  const handleResolve = () => {
    // TODO: implement properly in the next sprint
    setBackgroundColor(determineBackgroundColor(Status.Seen));
  };

  return <>
    <Card className={styles.card} style={{ backgroundColor }}>
      <CardActionArea className={styles.cardContent} onClick={() => router.push(`/request/${requestId}`)}>
        <div className={styles.cardHeader}>
          <div className={styles.zidNameContainer}>
            <TagBox text={formatZid(zid)} backgroundColor='var(--colour-main-purple-400)' color='var(--colour-main-purple-900)' />
            <Typography className={styles.textHeading} variant='h6'>
              {firstName + ' ' + lastName}
            </Typography>
          </div>
          <div className={styles.previousRequestsContainer}>
            <TagBox text={`PREVIOUS TOTAL REQUESTS: ${previousRequests}`} backgroundColor='var(--colour-main-purple-400)' color='var(--colour-main-purple-900)' />
          </div>
        </div>
        <div className={styles.titleContainer}>
          <Typography className={styles.textHeading} variant='h6'>
            {title}
          </Typography>
        </div>
        <div className={styles.tagContainer}>
          {tags?.map((tag, i) => {
            return <TagBox text={tag.name} key={i} isPriority={tag.isPriority} backgroundColor='var(--colour-main-yellow-500)' color='white' />;
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
