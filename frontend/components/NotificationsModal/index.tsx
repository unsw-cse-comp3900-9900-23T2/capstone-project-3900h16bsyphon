import IconButton from '@mui/material/IconButton';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useEffect, useState } from 'react';
import Modal from '@mui/material/Modal';
import styles from './NotificationsModal.module.css';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsCard from '../NotificationsCard';
import useAuthenticatedWebSocket from '../../hooks/useAuthenticatedWebSocket';
import { authenticatedGetFetch, getToken } from '../../utils';
import { useRouter } from 'next/router';
import { setRef } from '@mui/material';

const data = [
  {
    title: 'COMP1511 Help Session overloaded',
    description: '1 Tutor has been assigned to complete 10 requests in 45 minutes! Consider assigning more tutors!'
  },
  {
    title: 'COMP211 Help Session overloaded',
    description: '1 Tutor has been assigned to complete 10 requests in 45 minutes! Consider assigning more tutors!'
  }
];

type Notification = {
  notifId: number;
  zid: number,
  content: string,
  createdAt: Date,
  seen: boolean,
}

const NotificationsModal = () => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [refresh, setRefresh] = useState(false);

  const router = useRouter();

  const { lastJsonMessage } = useAuthenticatedWebSocket('ws:localhost:8000/ws/notifications', {
    onOpen: () => {
      console.log('connected [notification]');
    },
    shouldReconnect: () => true,
  }, !!router);

  useEffect(() => {
    const fetchNotifs = async () => {
      const res = await authenticatedGetFetch('/notifs/all');
      if (!res.ok) {
        console.error('failed to fetch notifications. check network tab');
        return;
      }
      setNotifs(await res.json());
    };
    fetchNotifs();
  }, [lastJsonMessage, refresh, open]);
  console.log('notifs', notifs);

  const getTitle = (content: string): string => {
    const split = content.split(':');
    return split.length > 0 ? split[0] : 'Notification';
  };

  const getDescription = (content: string): string => {
    const split = content.split(':');
    if (split.length <= 1) {
      return 'No description';
    }
    return split[1];
  };

  const causeRefresh = () => {
    setRefresh(!refresh);
  };

  return (
    <div>
      <IconButton aria-label="notifications" onClick={handleOpen}>
        <NotificationsIcon />
      </IconButton>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="generate join invite modal"
        aria-describedby="generate join invite modal"
      >
        <div className={styles.container}>
          <div className={styles.titleContainer}>
            <h2 className={styles.title}>Notifications</h2>
            <IconButton
              onClick={handleClose}
              size="small"
              aria-label="close modal button"
            >
              <CloseIcon />
            </IconButton>
          </div>
          {notifs !== null && notifs.length !== 0 ? (
            notifs.filter(d => !d.seen).map((d, index) => (
              <NotificationsCard
                key={index}
                title={getTitle(d.content)}
                description={getDescription(d.content)}
                notifId={d.notifId}
                causeRefresh={causeRefresh}
              />
            ))
          ) : (
            <p>There are no new notifications</p>
          )}
          <Button onClick={handleClose} className={styles.doneBtn}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default NotificationsModal;
