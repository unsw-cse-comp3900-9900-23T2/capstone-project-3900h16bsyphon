import { ClockNumberClassKey } from '@mui/x-date-pickers';
import { useEffect, useState } from 'react';
import UserProfileCard from '../../components/UserProfileCard';
import { authenticatedGetFetch, toCamelCase } from '../../utils';
import styles from './UserProfilePage.module.css';

interface CoursePermission {
  courseCode: string,
  courseOfferingId: number,
  title: string,
}
interface UserProfileCardProps {
  zid: number;
  firstName: string;
  lastName: string;
  tutor: CoursePermission[];
  courseAdmin: CoursePermission[];
}

const userInformation: UserProfileCardProps = {
  zid: 0,
  firstName: '',
  lastName: '',
  tutor: [],
  courseAdmin: [],
};

export default function UserProfile() {

  const [responseData, setResponseData] = useState<UserProfileCardProps>(userInformation);
  
  useEffect(() => {
    const getData = async () => {
      const res = await authenticatedGetFetch('/user/profile', {});
      if (!res.ok) {
        console.error('authentication failed, or something broke, check network tab');
        return;
      }
      setResponseData(toCamelCase(await res.json()));
    };
    getData();
  },[]);

  
  return (
    <div className={styles.pageContainer}>
      <UserProfileCard
        zid={responseData.zid}
        firstName={responseData.firstName}
        lastName={responseData.lastName}
        tutor={responseData.tutor}
        courseAdmin={responseData.courseAdmin}
      />
    </div>
  );
}

