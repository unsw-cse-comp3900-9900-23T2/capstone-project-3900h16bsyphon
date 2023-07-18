import {Button, Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import styles from './Chat.module.css';
import useAuthenticatedWebSocket from '../../hooks/useAuthenticatedWebSocket';



type ChatBoxProps = {
  requestId: number;
  studentZid?: number;
  isStudent: boolean;
};

type Message = {
  type: 'message';
  request_id: number;
  content: string;
  sender: number;

};


const ChatBox = ({requestId, studentZid = -1, isStudent} : ChatBoxProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const { sendJsonMessage, lastJsonMessage } = useAuthenticatedWebSocket('ws:localhost:8000/ws/chat', {
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
    setNewMessage('');
  };

  useEffect(() => {
    if (!lastJsonMessage) return;
    if ((lastJsonMessage as any)?.type === 'message') {
      setMessages(messages => [...messages, lastJsonMessage as Message]);
    }
  }, [lastJsonMessage]);

  return (
    <Grid container spacing={1} className={styles.container}>
      <Grid item xs={12} className={styles.messageContainer}>
        {messages.map((message, index) => (
          (isStudent && message.sender === studentZid) || (!isStudent && message.sender !== studentZid) ?
            <div key={index} className={styles.myMessage}>
              {message.content}
            </div>
            :
            <div key={index} className={styles.otherMessage}>
              {message.content}
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
              <Button variant='contained' color='inherit' onClick={handleMessageSend}>
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
