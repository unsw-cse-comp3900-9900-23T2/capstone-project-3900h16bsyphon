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

export type RequestData = {
  courseOfferingId: number,
  description: string,
  firstName: string,
  isClusterable: boolean,
  lastName: string,
  order: number,
  queueId: number,
  requestId: number,
  status: string,
  tags: Tag[],
  title: string,
  zid: number,
};
