import { Duration, Tag } from './requests';

export type QueueData = {
    queueId: string;
    startTime: string;
    endTime: string;
    isVisible: boolean;
    isAvailable: boolean;
    timeLimit: number;
    title: string;
    announcement: string;
    courseOfferingId: string;
}

type QueueTutorSummaryData = {
  zid: number,
  firstName: string,
  lastName: string,
  totalSeen: number,
  totalSeeing: number,
  averageTime: number,
  tagsWorkedOn: Tag[],
};

type QueueTagSummaryData = {
  tag: Tag,
  duration: Duration,
};

type QueueSummaryData = {
  title: string,
  startTime: Date,
  endTime: Date,
  duration: Duration,
  tutorSummaries: QueueTutorSummaryData[],
  timeSpentPerTag: QueueTagSummaryData[],
};
