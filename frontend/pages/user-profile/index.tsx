import UserProfileCard from '../../components/UserProfileCard';
import styles from './UserProfilePage.module.css';

interface UserProfileCardProps {
  zid: string;
  firstName: string;
  lastName: string;
  isUserAdmin: boolean;
  tutor: string[];
  courseAdmin: string[];
}

const userInformation: UserProfileCardProps = {
  zid: 'z5555555',
  firstName: 'Jane',
  lastName: 'Doe',
  isUserAdmin: false,
  tutor: ['COMP1521', 'COMP2041'],
  courseAdmin: ['COMP1010'],
};

export default function UserProfile() {
  return (
    <div className={styles.pageContainer}>
      <UserProfileCard
        zid={userInformation.zid}
        firstName={userInformation.firstName}
        lastName={userInformation.lastName}
        isUserAdmin={userInformation.isUserAdmin}
        tutor={userInformation.tutor}
        courseAdmin={userInformation.courseAdmin}
      />
    </div>
  );
}
