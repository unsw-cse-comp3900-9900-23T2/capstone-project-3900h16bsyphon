import { useEffect, useState } from 'react';
import { getToken } from '../utils';
import useWebSocket, { Options } from 'react-use-websocket';

type WebSocketArgs = [string | (() => string | Promise<string>) | null, Options?, boolean?]

export default function useAuthenticatedWebSocket(...args: WebSocketArgs) {
  let [token, setToken] = useState('');
  let wsReturn = useWebSocket(...args);
  
  useEffect(() => {
    setToken(getToken());
  }, []);

  useEffect(() => {
    if (!token) return;
    wsReturn.sendMessage(token);
  // cant use exhaustive deps, only run first time
  // eslint-disable-next-line
  }, [token]);

  return wsReturn;
}
