import {Button, Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import styles from './Chat.module.css';
import useWebSocket from 'react-use-websocket';



type ChatBoxProps = {
  requestId: number;
};

const ChatBox = ({requestId} : ChatBoxProps) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const socketUrl = 'ws://localhost:8000/ws/chat';
  const {
    sendMessage,
    lastMessage,
    readyState,
  } = useWebSocket(socketUrl, {
    queryParams: {request_id: requestId},
    onOpen: () => {
      console.log('connected');
    },
    //Will attempt to reconnect on all close events, such as server shutting down
    shouldReconnect: () => true,
    onMessage: (e) =>  {
      //setMessages([...messages, e.data]);
      console.log(e.data);
    },
  },
  !!requestId
  );

  const handleMessageSend = () => {
    if (newMessage.trim() === '') {
      return;
    }
    //sendJsonMessage(newMessageObj);
    sendMessage(newMessage);
    setMessages([...messages, newMessage]);
    setNewMessage('');
  };

  useEffect(() => {
    if (lastMessage !== null) {
      setMessages([...messages, lastMessage.data]);
    }
  }, [lastMessage, messages]);

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
