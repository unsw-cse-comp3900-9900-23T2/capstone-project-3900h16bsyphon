import { Card, Typography } from '@mui/material';
import styles from './QueueTagSummaryCard.module.css';
import TagBox from '../TagBox';
import { QueueTagSummaryData } from '../../types/queues';

type QueueTagSummaryCardProps = {
  tagSummaries: QueueTagSummaryData[]
}

const QueueTagSummaryCard = ({ tagSummaries }: QueueTagSummaryCardProps) => {
  
  return <>
    <Card className={styles.infoCard}>
      <div className={styles.infoCardTitleContainer}>
        <Typography className={styles.summaryHeadings}  variant='h5'>Time Spent per Tag:</Typography>
      </div>
      <div className={styles.allSummaryItemsContainer}>

        <div className={styles.tagsContainer}>
          {tagSummaries.map((tagSummary) => {
            return <div className={styles.summaryItem} key={tagSummary.tag.tagId}>
              <TagBox
                text={tagSummary.tag.name}
                isPriority={tagSummary.tag.isPriority}
                backgroundColor="var(--colour-main-yellow-500)"
                color="white"
              /> 
              <Typography variant='body1'>{tagSummary.duration.hours.toString() + ' hours ' + tagSummary.duration.minutes.toString() + ' mins'}</Typography>
            </div>;
          })}
        </div>
      </div>
    </Card>
  </>;
};

export default QueueTagSummaryCard;
