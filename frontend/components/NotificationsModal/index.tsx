import IconButton from '@mui/material/IconButton';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useState } from 'react';
import Modal from '@mui/material/Modal';
import styles from './NotificationsModal.module.css';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsCard from '../NotificationsCard';

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
            <h2 className={styles.title}>
              Notifications
            </h2>
            <IconButton onClick={handleClose} size="small"
              aria-label="close modal button">
              <CloseIcon />
            </IconButton>
          </div>
          {data.map((d, index) => 
            <NotificationsCard key={index} title={d.title} description={d.description} />
          )}
          <Button onClick={handleClose} className={styles.doneBtn}>
						Close modal
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default NotificationsModal;
