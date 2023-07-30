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

type Tag = {
    tagId: number;
    name: string;
    isPriority: boolean;
    requestIds: number[];
};

export type TagAnalytics = Tag[];
