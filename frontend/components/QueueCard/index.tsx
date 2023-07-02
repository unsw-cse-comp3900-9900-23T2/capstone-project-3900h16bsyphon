import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import styles from './QueueCard.module.css';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TagBox from '../TagBox';

type QueueCardProps = {
  title: string;
  seen?: number;
  unseen?: number;
  location: String[];
  courseAdmins?: String[];
  isEdit?: boolean;
}

export default function QueueCard({ title, seen, unseen, location, courseAdmins, isEdit }: QueueCardProps) {
  return (
    <div>
      <Card className={styles.card}>
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
      </Card>
    </div>
  );
}
