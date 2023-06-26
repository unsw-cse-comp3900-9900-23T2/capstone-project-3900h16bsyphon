import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import styles from './NotificationsCard.module.css';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';

// TODO: update props
type NotificationsCardProps = {
  title: string;
  description: string;
}

const NotificationsCard = ({ title, description }: NotificationsCardProps) => {
  // TODO: replace content
  return (
    <div>
      <Card className={styles.card}>
        <CardContent>
          <Typography className={styles.heading}>
            {title}
          </Typography>
          <Typography className={styles.description}>{description}</Typography>
        </CardContent>
        <CardActions>
          {/* TODO: add functionality */}
          <Button className={styles.button}>Dismiss</Button>
        </CardActions>
      </Card>
    </div>
  );
};

export default NotificationsCard;
