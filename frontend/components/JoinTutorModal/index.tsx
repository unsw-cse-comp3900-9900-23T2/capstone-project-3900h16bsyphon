import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import styles from './JoinTutorModal.module.css';

const JoinTutorModal = () => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      <Button onClick={handleOpen} variant="contained" startIcon={<AddIcon />} className={styles.button}>Join as tutor</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="join course as tutor modal"
        aria-describedby="generate join tutor link"
      >
        <Box className={styles.container}>
          <Typography id="enter tutor code" variant="h6" component="h2">
            Enter tutor code
          </Typography>
          <TextField id="outlined-basic" variant="outlined" />
          <Button onClick={handleClose} variant="contained" className={styles.button}>Join as tutor</Button>
        </Box>
      </Modal>
    </div>
  );
};

export default JoinTutorModal;

