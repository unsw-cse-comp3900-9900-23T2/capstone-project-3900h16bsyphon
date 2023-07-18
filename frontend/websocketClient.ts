import { Message } from './types/messages';

export default class Client {
  socket: WebSocket;
  messages: Message[] = []; // conversation
  clientID: string;

  constructor(url: string, clientID: string) {
    this.socket = new WebSocket(url);
    this.clientID = clientID;

    this.socket.onopen = () => {
      console.log('connected');
    };

    this.socket.onmessage = (e) => {
      console.log(e.data);
      const msg = JSON.parse(e.data);
      if (msg.Type === 'open') {
        this.send({
          Type: 'open',
          Contents: this.clientID,
          ClientID: this.clientID,
        });
      } else if (msg.Type === 'message') {
        console.log(msg.Contents);
        this.messages.push(msg);
      } else if (msg.Type === 'close') {
        console.log('closing');
        this.socket.close();
      }

    };

    this.socket.onclose = (event) => {
      console.log('Socket Closed Connection: ', event);
    };

    this.socket.onerror = (error) => {
      console.log('Socket Error: ', error);
    };
  }

  public send(message: Message) {
    if (this.socket.readyState === this.socket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      this.messages.push(message);
    }
  }

  public getMessages() {
    return this.messages;
  }
}
