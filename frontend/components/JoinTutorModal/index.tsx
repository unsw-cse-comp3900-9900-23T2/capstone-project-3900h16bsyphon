import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import AddIcon from '@mui/icons-material/Add';
import styles from './JoinTutorModal.module.css';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { authenticatedPutFetch } from '../../utils';
import TextInput from '../TextInput';
import Alert from '@mui/material/Alert';
import { useRouter } from 'next/router';

const JoinTutorModal = () => {
  const [open, setOpen] = useState(false);
  const [tutorCode, setTutorCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setError('');
    router.reload();
  };

  const handleSubmit = async () => {
    let res = await authenticatedPutFetch('/course/join_with_tutor_link', {
      tutor_link: tutorCode
    });
    if (!res.ok) {
      setError('Course does not exist with given invite code, please try again.');
      return;
    }
    handleClose();
    return;
  };

  return (
    <div>
      <Button onClick={handleOpen} startIcon={<AddIcon />} className={styles.joinAsTutorBtn}>Join as tutor</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="join course as tutor modal"
        aria-describedby="generate join tutor link"
      >
        <div className={styles.container}>
          <div className={styles.titleContainer}>
            <h2>Enter tutor code</h2>
            <IconButton onClick={handleClose} size="small"
              aria-label="close modal button">
              <CloseIcon />
            </IconButton>
          </div>
          {error && <Alert severity="error">{error}</Alert>}
          <TextInput label=' ' value={tutorCode} setValue={setTutorCode} />
          <Button onClick={handleSubmit} className={styles.joinBtn}>Join as tutor</Button>
        </div>
      </Modal>
    </div>
  );
};

export default JoinTutorModal;
