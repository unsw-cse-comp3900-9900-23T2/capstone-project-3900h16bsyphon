import {Button, Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import styles from './Chat.module.css';
import useWebSocket from 'react-use-websocket';


type Message = {
  senderZid: number;
  text: string;
}

type ChatBoxProps = {
  requestId: number;
  zid: number;
};


const ChatBox = ({requestId, zid} : ChatBoxProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const socketUrl = 'ws://localhost:8080';
  const {
    sendMessage,
    lastJsonMessage,
    readyState,
  } = useWebSocket(socketUrl, {
    onOpen: () => console.log('opened'),
    //Will attempt to reconnect on all close events, such as server shutting down
    shouldReconnect: () => false,
    onMessage: (e) =>  {
      //setMessages([...messages, e.data]);
      console.log(e.data);
    }

  });

  const handleMessageSend = () => {
    if (newMessage.trim() === '') {
      return;
    }
    const newMessageObj: Message = {
      senderZid: zid,
      text: newMessage,
    };
    //sendJsonMessage(newMessageObj);
    console.log(newMessageObj);
    sendMessage(JSON.stringify(newMessageObj));
    setMessages([...messages, newMessageObj]);
    setNewMessage('');
  };

  useEffect(() => {
    console.log('spam?');
    if (lastJsonMessage && (lastJsonMessage as Message).senderZid !== zid) {
      setMessages([...messages, lastJsonMessage as Message]);
    }
  }, [lastJsonMessage, zid]);

  return (
    <Grid container spacing={1} className={styles.container}>
      <Grid item xs={12} className={styles.messageContainer}>
        {messages.map((message, index) => (
          <div key={index} className={styles.message}>
            {message.text}
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
