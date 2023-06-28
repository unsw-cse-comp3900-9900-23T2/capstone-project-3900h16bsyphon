import { Button, Card, CardActionArea, CardActions, Typography } from '@mui/material';
import styles from './StudentQueueRequestCard.module.css';
import { useRouter } from 'next/router';
import TagBox from '../TagBox';

interface StudentQueueRequestCardProps {
  zid: string,
  firstName: string,
  lastName: string,
  title: string,
  tags: string[],
  previousRequests: number,
}

const StudentQueueRequestCard = ({ zid, firstName, lastName, title, previousRequests, tags}: StudentQueueRequestCardProps) => {
  const router = useRouter();

  return <>
    <Card className={styles.card}>
      <CardActionArea className={styles.cardContent} onClick={() => router.push('/wait/1')}>
        <div className={styles.cardHeader}>
          <div className={styles.zidNameContainer}>
            <div>
              <TagBox text={zid} backgroundColor='#D5CFFF' color='#3E368F' />
            </div>
            <div>
              <Typography className={styles.textHeading} variant='h6'>
                {firstName + ' ' + lastName}
              </Typography>
            </div>
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
          {tags.map((tag, i) => {
            return <TagBox text={tag} key={i} backgroundColor='#EDB549' color='white' />;
          })}
        </div>
      </CardActionArea>
      <CardActions className={styles.cardActions}>
        <Button variant='contained' >
          Claim
        </Button>
        <Button variant='contained' >
          Not Found
        </Button>
      </CardActions>
    </Card>
  
  </>;
};

export default StudentQueueRequestCard;
