import {Button, Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import styles from './Chat.module.css';
import useAuthenticatedWebSocket from '../../hooks/useAuthenticatedWebSocket';



type ChatBoxProps = {
  requestId: number;
};

type Message = {
  type: 'message' | 'join' | 'leave' | 'auth';
  request_id: number;
  content: string;
};


const ChatBox = ({requestId} : ChatBoxProps) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const { sendJsonMessage, lastJsonMessage, readyState } = useAuthenticatedWebSocket('ws:localhost:8000/ws/chat', {
    queryParams: {request_id: requestId},
    shouldReconnect: () => true,
  }, !!requestId);

  const handleMessageSend = () => {
    if (newMessage.trim() === '') {
      return;
    }
    sendJsonMessage({
      type: 'message',
      request_id: requestId,
      content: newMessage,
    });
    setMessages([...messages, newMessage]);
    setNewMessage('');
  };

  useEffect(() => {
    if (lastJsonMessage) {
      console.log(lastJsonMessage);
      setMessages([...messages, '']);
    }
  }, [lastJsonMessage]);



  return (
    <Grid container spacing={1} className={styles.container}>
      <Grid item xs={12} className={styles.messageContainer}>
        {messages.map((message, index) => (
          <div key={index} className={styles.message}>
            {message}
          </div>
        ))}
      </Grid>
      <Grid item xs={12} className={styles.inputContainer}>
        <TextField
          label='Enter a message'
          value={newMessage}
          fullWidth
          onChange={(e) => setNewMessage(e.target.value)}
          InputProps={{
            endAdornment: (
              <Button variant='contained' color='primary' onClick={handleMessageSend}>
                  Send
              </Button>
            ),
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleMessageSend();
            }
          }}
        />
      </Grid>
    </Grid>
  );
};

export default ChatBox;
