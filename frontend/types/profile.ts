import { CourseOfferingInfo } from './courses';

export type UserProfile = {
    zid: number;
    firstName: string;
    lastName: string;
    isOrgAdmin: boolean;
    tutor: CourseOfferingInfo[];
    courseAdmin: CourseOfferingInfo[];
};
