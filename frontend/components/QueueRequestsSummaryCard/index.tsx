import { Card, Typography } from '@mui/material';
import styles from './QueueRequestsSummaryCard.module.css';
import TagBox from '../TagBox';
import { QueueRequestSummaryData } from '../../types/queues';
import { formatZid, getActualDuration } from '../../utils';
import DurationBox from '../DurationBox';

type QueueRequestsSummaryCardProps = {
  requests: QueueRequestSummaryData[];
};

const QueueRequestsSummaryCard = ({
  requests,
}: QueueRequestsSummaryCardProps) => {
  return (
    <>
      <Card className={styles.infoCard}>
        <div className={styles.infoCardTitleContainer}>
          <Typography className={styles.summaryHeadings} variant='h5'>
            Time Per Request:
          </Typography>
        </div>
        <div className={styles.allSummaryItemsContainer}>
          <div className={styles.tagsContainer}>
            {requests.map((request: QueueRequestSummaryData) => {
              return (
                <div className={styles.summaryItem} key={request.requestId}>
                  <div className={styles.zidNameContainer}>
                    <TagBox
                      text={formatZid(request.zid)}
                      backgroundColor='var(--colour-main-yellow-500)'
                      color='white'
                    />
                    <Typography
                      className={styles.summaryHeadings}
                      variant='body1'
                    >
                      {request.firstName + ' ' + request.lastName}
                    </Typography>
                  </div>
                  <div className={styles.durationContainer}>
                    {request.duration && (
                      <DurationBox
                        duration={getActualDuration(request.duration)}
                      />
                    )}
                    {!request.duration && !request.isSelfResolved && (
                      <Typography variant='body1'>Unresolved</Typography>
                    )}
                    {!request.duration && request.isSelfResolved && (
                      <Typography variant='body1'>Resolved by student</Typography>
                    )}
                  </div>  
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </>
  );
};

export default QueueRequestsSummaryCard;
