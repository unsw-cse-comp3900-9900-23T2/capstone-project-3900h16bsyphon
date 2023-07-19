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
        <Typography className={styles.textHeading} variant="h6">
          Time summary:
        </Typography>
        <div className={styles.timeContainer}>
          <Typography variant="subtitle2">
            Start time: { status === Status.Seeing ? `${convertTime(startTime)}` : 'N/A'}
          </Typography>
          {/* TODO: add polling */}
          <Timer startTime={startTime} />
        </div>
      </CardContent>
    </Card>
  );
}


