import IconButton from '@mui/material/IconButton';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useEffect, useState } from 'react';
import Modal from '@mui/material/Modal';
import styles from './NotificationsModal.module.css';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsCard from '../NotificationsCard';
import useAuthenticatedWebSocket from '../../hooks/useAuthenticatedWebSocket';
import { getToken } from '../../utils';
import { useRouter } from 'next/router';

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

const NotificationsModal = () => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const router = useRouter();

  const { sendJsonMessage, lastJsonMessage } = useAuthenticatedWebSocket('ws:localhost:8000/ws/notifications', {
    onOpen: () => {
      console.log('connected [notification]');
    },
    shouldReconnect: () => true,
  }, !!router);

  useEffect(() => {
    if (!lastJsonMessage) return;
    console.log('lastJsonMessage', lastJsonMessage);
    if ((lastJsonMessage as any)?.type === 'notification') {
      console.log('lastJsonMessage: notif', lastJsonMessage);
    }
  }, [lastJsonMessage]);

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
          {data !== null && data.length !== 0 ? (
            data.map((d, index) => (
              <NotificationsCard
                key={index}
                title={d.title}
                description={d.description}
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
