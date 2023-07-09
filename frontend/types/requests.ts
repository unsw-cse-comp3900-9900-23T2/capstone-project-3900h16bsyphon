export type Tag = {
  tagId: number,
  name: string,
  isPriority: boolean
};


export type UserRequest = {
  zid: number,
  requestId: number,
  queueId: number,
  firstName: string,
  lastName: string,
  title: string,
  tags: Tag[],
  status: string,
  description: string,
};
