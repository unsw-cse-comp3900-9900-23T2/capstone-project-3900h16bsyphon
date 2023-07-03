import { Button, Card, CardActionArea, CardActions, Typography } from '@mui/material';
import styles from './StudentQueueRequestCard.module.css';
import { useRouter } from 'next/router';
import TagBox from '../TagBox';
import { useState } from 'react';

type StudentQueueRequestCardProps = {
  zid: string,
  firstName: string,
  lastName: string,
  title: string,
  tags: string[],
  previousRequests: number,
  requestId: number,
  status: string,
}

const StudentQueueRequestCard = ({ zid, firstName, lastName, title, previousRequests, tags, requestId, status }: StudentQueueRequestCardProps) => {
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
  const handleNotFound = () => {
    // TODO: implement properly in the next sprint
    setBackgroundColor(determineBackgroundColor('Not Found'));
  };

  const handleResolve = () => {
    // TODO: implement properly in the next sprint
    setBackgroundColor(determineBackgroundColor('Resolve'));
  };


  return <>
    <Card className={styles.card} style={{ backgroundColor }}>
      <CardActionArea className={styles.cardContent} onClick={() => router.push(`/request/${requestId}`)}>
        <div className={styles.cardHeader}>
          <div className={styles.zidNameContainer}>
            <TagBox text={zid} backgroundColor='#D5CFFF' color='#3E368F' />
            <Typography className={styles.textHeading} variant='h6'>
              {firstName + ' ' + lastName}
            </Typography>
          </div>
          <div className={styles.previousRequestsContainer}>
            <TagBox text={'PREVIOUS TOTAL REQUESTS: ' + previousRequests} backgroundColor='#D5CFFF' color='#3E368F' />
          </div>
        </div>
        <div className={styles.titleContainer}>
          <Typography className={styles.textHeading} variant='h6'>
            {title}
          </Typography>
        </div>
        <div className={styles.tagContainer}>
          {tags?.map((tag, i) => {
            return <TagBox text={tag} key={i} backgroundColor='#EDB549' color='white' />;
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
