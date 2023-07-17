import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import styles from './TimeSummaryCard.module.css';
import dayjs from 'dayjs';
import Timer from '../Timer';
import { Status } from '../../types/requests';

type TimeSummaryCardProps = {
  startTime: Date;
  status: Status;
}

export default function TimeSummaryCard({ startTime, status } : TimeSummaryCardProps) {
  const convertTime = (time: Date) => dayjs(time).format('hh:mmA');

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
          <Timer startTime={startTime} />
        </div>
      </CardContent>
    </Card>
  );
}


