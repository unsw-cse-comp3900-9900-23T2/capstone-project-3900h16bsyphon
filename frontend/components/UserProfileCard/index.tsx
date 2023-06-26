import { Box, Card, CardContent, TextField, CardHeader } from '@mui/material';
import UserPermissionsBox from '../UserPermissionBox';
import styles from './UserProfileCard.module.css';

interface UserProfileCardProps {
  zid: string;
  firstName: string;
  lastName: string;
  isUserAdmin: boolean;
  tutor: string[];
  courseAdmin: string[];
}

export default function UserProfileCard({
  zid,
  firstName,
  lastName,
  isUserAdmin,
  tutor,
  courseAdmin,
}: UserProfileCardProps) {
  return (
    <Box className={styles.cardBox}>
      <Card className={styles.cardContainer}>
        <CardHeader className={styles.cardHeader} title="Account Information" />
        <CardContent className={styles.cardContent}>
          <TextField
            id="outlined-read-only-input"
            label="zID"
            defaultValue={zid}
            InputProps={{
              readOnly: true,
            }}
            fullWidth
          />
          <TextField
            id="outlined-read-only-input"
            label="First Name"
            defaultValue={firstName}
            InputProps={{
              readOnly: true,
            }}
            fullWidth
          />
          <TextField
            id="outlined-read-only-input"
            label="Last Name"
            defaultValue={lastName}
            InputProps={{
              readOnly: true,
            }}
            fullWidth
          />
          <div
            className={styles.userPermissions}
          >
            {tutor.map( (course, i) =>           
            <UserPermissionsBox 
              key={i}
              permission='Tutor'
              courseOffering={course}
            />)}

            {courseAdmin.map( (course, i) =>           
            <UserPermissionsBox 
              key={i}
              permission='Course Admin'
              courseOffering={course}
            />)}
          </div>


        </CardContent>
      </Card>
    </Box>
  );
}
