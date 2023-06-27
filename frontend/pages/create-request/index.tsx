import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, TextField, Typography, Button } from '@mui/material';
import styles from './CreateRequest.module.css';
import { useRouter } from 'next/router';

const MIN_TITLE = 5;
const MIN_DESCRIPTION = 50;

export default function CreateRequest() {

  const router = useRouter();
  const [title, setTitle] = useState('');
  const [titleWordCount, setTitleWordCount] = useState(0);


  const navigateToDashboard = () => {
    router.push('/dashboard');
  };

  useEffect(() => {
    if (title.trim() === '') {
      setTitleWordCount(0);
    } else  {
      setTitleWordCount(title.trim().split(' ').length);
    }
  }, [title]);

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
              <div className={styles.headingWordCount}>
                <Typography className={styles.text} variant="subtitle1">
                  Title
                </Typography>
                <Typography className={styles.text} variant="subtitle1">
                  {(MIN_TITLE - titleWordCount) < 0 ? 0 : MIN_TITLE - titleWordCount} more words required
                </Typography>
              </div>
              <TextField
                className={styles.text}
                id="outlined-input"
                value={title}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setTitle(event.target.value);
                }}
                placeholder='Give a descriptive overview of the issue'
                fullWidth
              />
            </div>

            <div>
              <div className={styles.headingWordCount}>
                <Typography className={styles.text} variant="subtitle1">
                  Description
                </Typography>
                <Typography className={styles.text} variant="subtitle1">
                  {titleWordCount} words
                </Typography>
              </div>
              <TextField
                multiline
                rows={4}
                className={styles.text}
                placeholder='Give a detailed description of the issue. Include any error messages and what you have done so far to try and solve this.'
                id="outlined-input"
                fullWidth
              />
            </div>

            <div>
              <Typography className={styles.text} variant="subtitle1">
                Tags
              </Typography>
              <TextField
                multiline
                rows={4}
                className={styles.text}
                placeholder='Give a detailed description of the issue. Include any error messages and what you have done so far to try and solve this.'
                id="outlined-input"
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
