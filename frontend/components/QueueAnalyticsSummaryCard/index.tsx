import { Card, Typography } from '@mui/material';
import styles from './QueueAnalyticsSummaryCard.module.css';

type QueueAnalyticsSummaryCardProps = {
  studentsJoined: number,
  studentsResolved: number,
  studentsUnresolved: number,
};

const QueueAnalyticsSummaryCard = ({ studentsJoined, studentsResolved, studentsUnresolved }: QueueAnalyticsSummaryCardProps) => {
  
  return <>
    <Card className={styles.infoCard}>
      <div className={styles.infoCardTitleContainer}>
        <Typography className={styles.summaryHeadings}  variant='h5'>Queue Analytics</Typography>
      </div>
      <div className={styles.allSummaryItemsContainer}>
        <div className={styles.summaryItem} >
          <Typography className={styles.summaryHeadings} variant='body1'>Total students joined: </Typography>
          <Typography variant='body1'>{studentsJoined}</Typography>
        </div>
        <div className={styles.summaryItem} >
          <Typography className={styles.summaryHeadings} variant='body1'>Total requests resolved: </Typography>
          <Typography variant='body1'>{studentsResolved}</Typography>
        </div>
        <div className={styles.summaryItem} >
          <Typography className={styles.summaryHeadings} variant='body1'>Total requests unresolved: </Typography>
          <Typography variant='body1'>{studentsUnresolved}</Typography>
        </div>
      </div>
    </Card>
  </>;
};

export default QueueAnalyticsSummaryCard;
