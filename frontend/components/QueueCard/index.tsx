import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import styles from './QueueCard.module.css';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Link from 'next/link';

type QueueCardProps = {
  title: string;
  queueId: number;
  seen?: number;
  unseen?: number;
  location: String[];
  courseAdmins?: String[];
  isEdit?: boolean;
}

export default function QueueCard({ title, seen, unseen, location, courseAdmins, isEdit, queueId }: QueueCardProps) {
  return (
    <Link href={`/active-queue/${queueId}`}>
      <Card className={styles.card}>
        <CardContent>
          <div className={styles.chipContainer}>
            {courseAdmins && courseAdmins.map((c, index) => <Chip key={index} label={c} className={styles.courseAdminChip} />)}
            {location.map((l, index) => <Chip key={index} label={l} className={styles.locationChip} />)}
          </div>
          <Typography className={styles.heading}>
            {title}
          </Typography>
          <div className={styles.cardAction}>
            <div className={styles.chipContainer}>
              {seen && <Chip label={`${seen} seen`} className={styles.unseenChip} />}
              {unseen && <Chip label={`${unseen} unseen`} className={styles.seenChip} />}
            </div>
            {isEdit && <Button className={styles.editBtn}>Edit</Button>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
