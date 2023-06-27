import { Box, Card, CardContent, TextField, Typography, Button } from '@mui/material';
import styles from './CreateRequest.module.css';
import { useRouter } from 'next/router';

interface UserProfileCardProps {
  zid: string;
  firstName: string;
  lastName: string;
  isUserAdmin: boolean;
  tutor: string[];
  courseAdmin: string[];
}

export default function CreateRequest({
  zid,
  firstName,
  lastName,
  isUserAdmin,
  tutor,
  courseAdmin,
}: UserProfileCardProps) {

  const router = useRouter();

  const navigateToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className={styles.pageContainer} >
      <Box className={styles.cardBox}>
        <Card className={styles.cardContainer}>
          <div className={styles.cardHeader}>
            <Typography className={styles.text} variant="h4">
              Create Request
            </Typography>
          </div>

          <CardContent className={styles.cardContent}>
            <div>
              <Typography className={styles.text} variant="subtitle1">
                Title
              </Typography>
              <TextField
                className={styles.text}
                id="outlined-read-only-input"
                defaultValue={zid}
                fullWidth
              />
            </div>

            <div>
              <Typography className={styles.text} variant="subtitle1">
                Description
              </Typography>
              <TextField
                multiline
                className={styles.text}
                id="outlined-read-only-input"
                defaultValue={firstName}
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
                defaultValue={lastName}
                fullWidth
              />
            </div>

            <div className={styles.coursePermissionHeading}>
              <Typography className={styles.text} variant="h5">
                Course Permissions
              </Typography>
            </div>

            <div className={styles.buttonContainer}>
              <Button onClick={navigateToDashboard} className={styles.backButton} variant='contained' size='medium'>Back to Dashboard</Button>
              <Button onClick={navigateToDashboard} className={styles.createButton} variant='contained' size='medium'>Create Request</Button>
            </div>
          </CardContent>
        </Card>
      </Box>
    </div>

  );
}
