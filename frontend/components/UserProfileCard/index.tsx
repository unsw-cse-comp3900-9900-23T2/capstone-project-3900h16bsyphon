import { Box, Card, CardContent, TextField, Typography, Button } from '@mui/material';
import UserPermissionsBox from '../UserPermissionBox';
import styles from './UserProfileCard.module.css';
import { useRouter } from 'next/router';
import AddCoursePermissionsModal from '../AddCoursePermissionsModal';

type CoursePermission = {
  courseCode: string,
  courseOfferingId: number,
  title: string,
}
type UserProfileCardProps = {
  zid: number;
  firstName: string;
  lastName: string;
  isOrgAdmin: boolean,
  tutor: CoursePermission[];
  courseAdmin: CoursePermission[];
}

export default function UserProfileCard({
  zid,
  firstName,
  lastName,
  tutor,
  isOrgAdmin,
  courseAdmin,
}: UserProfileCardProps) {

  const router = useRouter();

  const navigateToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <Box className={styles.cardBox}>
      <Card className={styles.cardContainer}>
        <div className={styles.cardHeader}>
          <Typography className={styles.text} variant="h4">
            Account Information
          </Typography>
        </div>

        <CardContent className={styles.cardContent}>
          <div>
            <Typography className={styles.text} variant="subtitle1">
              zID
            </Typography>
            <TextField
              className={styles.text}
              id="outlined-read-only-input"
              value={zid}
              InputProps={{
                readOnly: true,
              }}
              fullWidth
            />
          </div>

          <div>
            <Typography className={styles.text} variant="subtitle1">
              First Name
            </Typography>
            <TextField
              className={styles.text}
              id="outlined-read-only-input"
              value={firstName}
              InputProps={{
                readOnly: true,
              }}
              fullWidth
            />
          </div>

          <div>
            <Typography className={styles.text} variant="subtitle1">
              Last Name
            </Typography>
            <TextField
              className={styles.text}
              id="outlined-read-only-input"
              value={lastName}
              InputProps={{
                readOnly: true,
              }}
              fullWidth
            />
          </div>

          <div className={styles.coursePermissionHeading}>
            <Typography className={styles.text} variant="h5">
              Course Permissions
            </Typography>
          </div>
          <div className={styles.userPermissions}>
            {tutor?.map((course, i) => (
              <UserPermissionsBox
                key={i}
                permission="Tutor"
                courseOffering={course.courseCode}
              />
            ))}

            {courseAdmin?.map((course, i) => (
              <UserPermissionsBox
                key={i}
                permission="Course Admin"
                courseOffering={course.courseCode}
              />
            ))}
          </div>

          <div className={styles.buttonContainer}>
            <AddCoursePermissionsModal tutor={tutor} />
            <Button onClick={navigateToDashboard} className={styles.backButton} variant='contained' size='medium'>Back</Button>
          </div>
        </CardContent>
      </Card>
    </Box>
  );
}
