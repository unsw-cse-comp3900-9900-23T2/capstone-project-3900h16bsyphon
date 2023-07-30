export type CourseOfferingData = {
    title: string;
    courseCode: string;
    courseOfferingId: number;
    startDate: string;
    tutorInviteCode: string;
};

export type AnalyticsWaitTime = {
    fullName: string,
    averageWait: number, 
};

export type AnalyticsWaitTimeData = {
    waitTimes: AnalyticsWaitTime[];
};
