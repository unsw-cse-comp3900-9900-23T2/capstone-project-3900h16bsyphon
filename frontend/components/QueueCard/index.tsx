import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import styles from './QueueCard.module.css';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TagBox from '../TagBox';
import { CardActionArea } from '@mui/material';
import { useRouter } from 'next/router';
import { authenticatedGetFetch } from '../../utils';

type QueueCardProps = {
  title: string;
  queueId: number;
  seen?: number;
  unseen?: number;
  location: String[];
  courseAdmins?: String[];
  isEdit?: boolean;
  isTutor: boolean;
  isPrevious?: boolean;
}

export default function QueueCard({ title, seen, unseen, location, courseAdmins, isEdit, queueId, isTutor, isPrevious }: QueueCardProps) {
  const router = useRouter();
  const findWhereToGo = async () => {
    if (isTutor && !isPrevious) {
      return `/active-queue/${queueId}`;
    } else if (isTutor && isPrevious) {
      return `/queue-summary/${queueId}`;
    }
    // if student, we need to find if the queue is open or not
    let res = await authenticatedGetFetch('/queue/is_open', { queue_id: queueId.toString() });
    let value = await res.json();
    if (value.is_open) {
      return `/create-request/${queueId}`;
    }
    return'/403';
  };
  return (
    <Card className={styles.card}>
      <CardActionArea onClick={async () => router.push(await findWhereToGo())}>
        <CardContent>
          <div className={styles.chipContainer}>
            {courseAdmins?.map((c, index) => <TagBox key={index} text={c.toString()} backgroundColor='var(--colour-main-purple-200)' color='var(--colour-main-purple-900)' bold={false} />)}
            {location?.map((l, index) => <TagBox key={index} text={l.toString()} backgroundColor='var(--colour-main-yellow-300)' color='white'/>)}
          </div>
          <Typography className={styles.heading}>
            {title}
          </Typography>
          <div className={styles.cardAction}>
            <div className={styles.chipContainer}>
              {seen && <TagBox text={`${seen} seen`} backgroundColor='var(--colour-main-green-200)' color='var(--colour-main-green-900)' bold={false} />}
              {unseen && <TagBox text={`${unseen} unseen`} backgroundColor='var(--colour-main-red-200)' color='var(--colour-main-red-900)' bold={false} />}
            </div>
            {isEdit && <Button className={styles.editBtn}>Edit</Button>}
          </div>
        </CardContent>
      </CardActionArea>

    </Card>
  );
}
