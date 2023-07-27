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
  previousRequests: number,
  title: string,
  tags: Tag[],
  status: Status,
  clusterId?: number,
  description: string,
  order: number
};

export type ClusterRequest = {
  clusterId: number,
  requests: UserRequest[],
}

export function isCluster(request: (UserRequest | ClusterRequest)): request is ClusterRequest {
  return Object.keys(request).includes('requests');
}

export type UserInfo = {
  zid: number,
  firstName: string,
  lastName: string,
}

export type TimeStamp = {
  eventTime: Date
}

export type Duration = {
  hours: number,
  minutes: number,
  seconds: number,
}

export type UserRequestSummary = {
  tutors: UserInfo[],
  startTime?: TimeStamp,
  endTime: TimeStamp,
  duration?: Duration
}

export type RequestData = {
  courseOfferingId: number,
  description: string,
  firstName: string,
  isClusterable: boolean,
  lastName: string,
  order: number,
  queueId: number,
  requestId: number,
  status: Status,
  tags: Tag[],
  title: string,
  zid: number,
};
