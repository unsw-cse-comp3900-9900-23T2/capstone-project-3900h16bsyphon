import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import styles from './QueueCard.module.css';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';

type QueueCardProps = {
  title: string;
  seen?: number;
  unseen?: number;
  location: String[];
  courseAdmins: String[];
  isEdit?: boolean;
}

export default function QueueCard({ title, seen, unseen, location, courseAdmins, isEdit }: QueueCardProps) {
  return (
    <div>
      <Card className={styles.card}>
        <CardContent>
          <div className={styles.chipContainer}>
            {courseAdmins.map((c, index) => <Chip key={index} label={c} className={styles.courseAdminChip} />)}
            {location.map((l, index) => <Chip key={index} label={l} className={styles.locationChip} />)}
          </div>
          <Typography className={styles.heading}>
            {title}
          </Typography>
          <div className={styles.cardAction}>
            <div className={styles.chipContainer}>
              {seen && <Chip label={`${seen} seen`} className={styles.unseenChip} />}
              {unseen && <Chip label={`${unseen} seen`} className={styles.seenChip} />}
            </div>
            {isEdit && <Button className={styles.editBtn}>Edit</Button>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
