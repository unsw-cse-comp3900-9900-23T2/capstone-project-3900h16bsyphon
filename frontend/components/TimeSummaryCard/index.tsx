import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import styles from './TimeSummaryCard.module.css';
import Timer from '../Timer';
import { Status } from '../../types/requests';
import { convertTime } from '../../utils';

type TimeSummaryCardProps = {
  startTime: Date;
  status: Status;
}

export default function TimeSummaryCard({ startTime, status } : TimeSummaryCardProps) {
  return (
    <Card>
      <CardContent>
        <Typography className={styles.textHeading} variant="h5">
          Time Summary:
        </Typography>
        <div className={styles.timeContainer}>
          <div className={styles.startTimeContainer}>
            <Typography className={styles.textHeading}  variant="body1">
              Start time: 
            </Typography>
            <Typography variant="body1">
              { status === Status.Seeing ? `${convertTime(startTime)}` : ' N/A'}
            </Typography>
          </div>
          {/* TODO: add polling */}
          <Timer startTime={startTime} />
        </div>
      </CardContent>
    </Card>
  );
}


