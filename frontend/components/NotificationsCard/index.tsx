import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import styles from './NotificationsCard.module.css';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import { authenticatedPostFetch } from '../../utils';

// TODO: update props
type NotificationsCardProps = {
  title: string;
  description: string;
  notifId: number;
  causeRefresh?: () => void;
}

const NotificationsCard = ({ title, description, notifId, causeRefresh }: NotificationsCardProps) => {
  // TODO: replace content

  const handleDismiss = async () => {
    const res = await authenticatedPostFetch('/notifs/dismiss', {
      'notif_id': notifId,
    });
    if (!res.ok) {
      console.error('failed to dismiss notification. check network tab');
      return;
    }
    if (causeRefresh) causeRefresh();
  };

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
          <Button className={styles.button} onClick={handleDismiss}>Dismiss</Button>
        </CardActions>
      </Card>
    </div>
  );
};

export default NotificationsCard;
