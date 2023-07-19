import { Duration, Tag, TimeStamp } from './requests';

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

export type QueueTutorSummaryData = {
  zid: number,
  firstName: string,
  lastName: string,
  totalSeen: number,
  totalSeeing: number,
  averageTime: number,
  tagsWorkedOn: Tag[],
};

export type QueueTagSummaryData = {
  tag: Tag,
  duration: Duration,
};

export type QueueSummaryData = {
  title: string,
  courseCode: string,
  startTime: TimeStamp,
  endTime: TimeStamp,
  duration: Duration,
  tutorSummaries: QueueTutorSummaryData[],
  tagSummaries: QueueTagSummaryData[],
};
