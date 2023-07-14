import { Box, Paper, TextField } from '@mui/material';
import React from 'react';
import styles from './Chat.module.css';
import { Send } from '@mui/icons-material';

const ChatBox = () => {
  return (
    <Paper className={styles.container}> 
      <TextField className={styles.input}
        id="outlined-multiline-static"
        multiline
        rows={1}
        variant="outlined"
      />
    </Paper>
  );
};

export default ChatBox;
