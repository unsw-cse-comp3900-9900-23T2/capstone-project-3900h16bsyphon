'use client';
/* eslint-disable */
import React, { useState, useCallback,  useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';


const Socket = () => {

  const [socketUrl, setSocketUrl] = React.useState('ws:127.0.0.1:8000/sock/sock');


  // const socket = new WebSocket('ws://localhost:3000');
  const wsReturn = useWebSocket(socketUrl);
  const { sendMessage, lastMessage, readyState, getWebSocket } = wsReturn;
  console.log('wsReturn', wsReturn);
  const handleClickSendMessage = useCallback(() => sendMessage('Hello'), []);
  const [messageHistory, setMessageHistory] = useState([]);

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];


  return (
    <div>
      <div></div>
      <button
        onClick={handleClickSendMessage}
        disabled={readyState !== ReadyState.OPEN}
      >
        Click Me to send 'Hello'
      </button>
      <div>The WebSocket is currently {connectionStatus}.</div>
      <h2>Messages (Total {messageHistory.length}):</h2>
      {lastMessage ? <span>Last message: {lastMessage.data}</span> : null}
      <ul>
        {messageHistory.map((message, idx) => (
          <span key={idx}>{message ? `${message}` : null}</span>
        ))}
      </ul>
    </div>
  );
};

export default Socket;


