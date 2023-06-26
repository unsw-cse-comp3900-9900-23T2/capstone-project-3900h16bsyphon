import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import styles from './JoinTutorModal.module.css';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const JoinTutorModal = () => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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
          <TextField id="outlined-basic" variant="outlined" />
          <Button onClick={handleClose} className={styles.joinBtn}>Join as tutor</Button>
        </div>
      </Modal>
    </div>
  );
};

export default JoinTutorModal;

