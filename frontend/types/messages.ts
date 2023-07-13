export type Message =  {
    Type: 'open' | 'message' | 'close';
    Contents: string;
    ClientID?: string;
  }
