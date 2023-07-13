export type Tag = {
  tagId: number,
  name: string,
  isPriority: boolean
};

export enum Status {
  NotFound = 'NotFound',
  Seeing = 'Seeing',
  Seen = 'Seen',
  Unseen = 'Unseen',
}

export type UserRequest = {
  zid: number,
  requestId: number,
  queueId: number,
  firstName: string,
  lastName: string,
  title: string,
  tags: Tag[],
  status: Status,
  description: string,
  order: number
};
