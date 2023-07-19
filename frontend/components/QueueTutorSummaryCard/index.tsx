import { Card, Typography } from '@mui/material';
import styles from './QueueTutorSummaryCard.module.css';
import { changeBackgroundColour, changeTextColour, formatZid } from '../../utils';
import TagBox from '../TagBox';
import { QueueTutorSummaryData } from '../../types/queues';

const QueueTutorSummaryCard = ({ zid, firstName, lastName, totalSeen, totalSeeing, averageTime, tagsWorkedOn}: QueueTutorSummaryData) => {
  
  return <>
    <Card className={styles.infoCard}>
      <div className={styles.infoCardTitleContainer}>
        <Typography className={styles.summaryHeadings}  variant='h5'>Tutor Summary: {firstName} {lastName}</Typography>
        <TagBox
          text={formatZid(zid)}
          backgroundColor="var(--colour-main-purple-400)"
          color="var(--colour-main-purple-900)"
        />
      </div>
      <div className={styles.allSummaryItemsContainer}>
        <div className={styles.summaryItem} >
          <Typography className={styles.summaryHeadings} variant='body1'>Total Requests Resolved: </Typography>
          <Typography variant='body1'>{totalSeen}</Typography>
        </div>
        <div className={styles.summaryItem} >
          <Typography className={styles.summaryHeadings} variant='body1'>Total Requests Worked On: </Typography>
          <Typography variant='body1'>{totalSeeing}</Typography>
        </div>
        <div className={styles.summaryItem} >
          <Typography className={styles.summaryHeadings} variant='body1'>Average Time Spent per Request: </Typography>
          <TagBox
            text={averageTime.toString() + ' mins'}
            backgroundColor={changeBackgroundColour({ hours: 0, minutes: averageTime, seconds: 0 })}
            color={changeTextColour({ hours: 0, minutes: averageTime, seconds: 0 })}
          />
        </div>
        <div className={styles.summaryItem} >
          <Typography className={styles.summaryHeadings} variant='body1'>Tags Worked On: </Typography>
          <div className={styles.tagsContainer}>
            {tagsWorkedOn.map((tag) => {
              return <TagBox
                text={tag.name}
                key={tag.tagId}
                isPriority={tag.isPriority}
                backgroundColor="var(--colour-main-yellow-500)"
                color="white"
              />; 
            })}
          </div>
        </div>
      </div>
    </Card>
  </>;
};

export default QueueTutorSummaryCard;
