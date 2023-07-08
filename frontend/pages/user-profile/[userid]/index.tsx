import { useEffect, useState } from 'react';
import UserProfileCard from '../../../components/UserProfileCard';
import { authenticatedGetFetch, toCamelCase } from '../../../utils';
import styles from './UserProfilePage.module.css';
import Header from '../../../components/Header';
import { useRouter } from 'next/router';

type CoursePermission = {
  courseCode: string,
  courseOfferingId: number,
  title: string,
}
type UserProfileCardProps = {
  zid: number;
  firstName: string;
  lastName: string;
  isOrgAdmin: boolean;
  tutor: CoursePermission[];
  courseAdmin: CoursePermission[];
}

const userInformation: UserProfileCardProps = {
  zid: 0,
  firstName: '',
  lastName: '',
  tutor: [],
  isOrgAdmin: false,
  courseAdmin: [],
};

export default function UserProfile() {
  const router = useRouter();
  const [responseData, setResponseData] = useState<UserProfileCardProps>(userInformation);
  
  useEffect(() => {
    console.log('the userprofile user_id queury is', router.query.userid);
    const getData = async () => {
      if (router.query.userid) {
        const res = await authenticatedGetFetch('/user/profile', { user_id: `${router.query.userid}` });
        if (!res.ok) {
          console.error('authentication failed, or something broke, check network tab');
          return;
        }
        setResponseData(toCamelCase(await res.json()));

      } else {
        const res = await authenticatedGetFetch('/user/current', {});
        if (!res.ok) {
          console.error('authentication failed, or something broke, check network tab');
          return;
        }
        setResponseData(toCamelCase(await res.json()));
      }
      console.log('the response data inside user-profile/zid is', responseData);
    };
    getData();
  },[]);

  
  return (
    <>
      <Header/>
      <div className={styles.pageContainer}>
        <UserProfileCard
          zid={responseData.zid}
          firstName={responseData.firstName}
          lastName={responseData.lastName}
          tutor={responseData.tutor}
          courseAdmin={responseData.courseAdmin}
        />
      </div>
    </>
  );
}

