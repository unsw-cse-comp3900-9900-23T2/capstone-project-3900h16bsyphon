import { Card, Typography } from '@mui/material';
import styles from './OverallTimeSummary.module.css';
import { Duration, TimeStamp } from '../../types/requests';
import { convertTime } from '../../utils';
import DurationBox from '../DurationBox';

type OverallTimeSummaryProps = {
  startTime?: TimeStamp,
  endTime: TimeStamp,
  duration?: Duration,
  backgroundColor?: string,
  textColor?: string,
}

const OverallTimeSummary = ({ startTime, endTime, duration, backgroundColor, textColor }: OverallTimeSummaryProps) => {
  
  return <>
    <Card className={styles.infoCard}>
      <Typography className={styles.summaryHeadings}  variant='h5'>Time Summary</Typography>
      <div className={styles.tutorIdNameContainer}>
        <div className={styles.tutorIdName} >
          {startTime &&
            <>
              <Typography className={styles.summaryHeadings} variant='body1'>Start Time:</Typography>
              <Typography variant='body1'>{convertTime(startTime?.eventTime)}</Typography>
            </>
          }
        </div>
        <div className={styles.tutorIdName} >
          <Typography className={styles.summaryHeadings} variant='body1'>End Time:</Typography>
          <Typography variant='body1'>{convertTime(endTime.eventTime)}</Typography>
        </div>
        {/* dont display duration if request was resolved by student */}
        {startTime &&
          <div className={styles.durationTagBoxContainer}>
            <DurationBox 
              duration={duration} 
              backgroundColor={backgroundColor}
              color={textColor}
            />
          </div>}
      </div>
    </Card>
  </>;
};

export default OverallTimeSummary;
