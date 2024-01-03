import React, { useState, useCallback,  useEffect } from 'react';
import { ReadyState } from 'react-use-websocket';
import useAuthenticatedWebSocket from '../../hooks/useAuthenticatedWebSocket';


const Socket = () => {
  const { sendJsonMessage, lastMessage, readyState } = useAuthenticatedWebSocket('ws/dumb');
  const [messageHistory, setMessageHistory] = useState<MessageEvent<any>[]>([]);
  
  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  useEffect(() => {
    if (lastMessage === null) return;
    setMessageHistory((prev) => { let curr = [...prev]; curr.push(lastMessage); return curr; });
  }, [lastMessage]);
  
  const handleClickSendMessage = useCallback(() => sendJsonMessage({
    type: 'message',
    request_id: 1,
    content: 'Hello'
  }), [sendJsonMessage]);

  return (
    <div>
      <div></div>
      <button
        onClick={handleClickSendMessage}
        disabled={readyState !== ReadyState.OPEN}
      >
        Click Me to send &apos;Hello&apos;
      </button>
      <div>The WebSocket is currently {connectionStatus}.</div>
      <h2>Messages (Total {messageHistory.length}):</h2>
      {lastMessage ? <span>Last message: {lastMessage.data}</span> : null}
      <ul>
        {messageHistory.map((message, idx) => (
          <span key={idx}>{JSON.stringify(message)}</span>
        ))}
      </ul>
    </div>
  );
};

export default Socket;
