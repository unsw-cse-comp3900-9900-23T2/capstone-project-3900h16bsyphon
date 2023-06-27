import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, TextField, Typography, Button, Select, MenuItem, OutlinedInput, SelectChangeEvent } from '@mui/material';
import styles from './CreateRequest.module.css';
import { useRouter } from 'next/router';

const MIN_TITLE = 5;
const MIN_DESCRIPTION = 50;


const tags = [
  'Assignment 1',
  'Lab 1',
  'Lab 2',
  'Lab 3',
  'Lab 4',
  'Subset 0',
  'Subset 1',
  'Subset 2',
];


export default function CreateRequest() {

  const router = useRouter();
  const [title, setTitle] = useState('');
  const [titleWordCount, setTitleWordCount] = useState(0);

  const [tagList, setTagList] = useState<string[]>([]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const {
      target: { value },
    } = event;
    setTagList(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value
    );
  };

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
                Tags (you must choose at least one)
              </Typography>
              <Select
                multiple
                fullWidth
                displayEmpty
                value={tagList as unknown as string}
                onChange={handleChange}
                input={<OutlinedInput />}
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <em>Select tags</em>;
                  }
                  return (selected as unknown as string[]).join(', ');
                }}
                inputProps={{ 'aria-label': 'Without label' }}
              >
                {tags.map((tag) => (
                  <MenuItem key={tag} value={tag}>
                    {tag}
                  </MenuItem>
                ))}
              </Select>
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
