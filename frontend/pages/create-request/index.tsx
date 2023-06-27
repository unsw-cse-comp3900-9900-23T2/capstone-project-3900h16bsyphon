/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Typography, 
  Button, 
  Select, 
  MenuItem, 
  OutlinedInput, 
  SelectChangeEvent, 
  FormControlLabel, 
  Checkbox
} from '@mui/material';
import styles from './CreateRequest.module.css';
import { useRouter } from 'next/router';
import MetaData from '../../components/MetaData';
import Header from '../../components/Header';

const MIN_TITLE = 5;
const MAX_TITLE = 25;

const MIN_DESCRIPTION = 50;
const MAX_DESCRIPTION = 250;

// TODO: fetch call for tags
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

  const [description, setDescription] = useState('');
  const [descriptionWordCount, setDescriptionWordCount] = useState(0);

  const [isClusterable, setIsClusterable] = useState(false);

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

  const handleSubmit = () => {
    // TODO: handle validation

    // TODO add queue 
    router.push('/queue');
  };

  useEffect(() => {
    if (title.trim() === '') {
      setTitleWordCount(0);
    } else  {
      setTitleWordCount(title.trim().split(' ').length);
    }
  }, [title]);

  useEffect(() => {
    if (description.trim() === '') {
      setDescriptionWordCount(0);
    } else  {
      setDescriptionWordCount(description.trim().split(' ').length);
    }
  }, [description]);

  return (
    <>
      <div className={styles.pageContainer}>
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
                  } }
                  placeholder='Give a descriptive overview of the issue'
                  fullWidth />
              </div>

              <div>
                <div className={styles.headingWordCount}>
                  <Typography className={styles.text} variant="subtitle1">
                    Description
                  </Typography>
                  <Typography className={styles.text} variant="subtitle1">
                    {(MIN_DESCRIPTION - descriptionWordCount) < 0 ? 0 : MIN_DESCRIPTION - descriptionWordCount} more words required
                  </Typography>
                </div>
                <TextField
                  multiline
                  rows={4}
                  className={styles.text}
                  value={description}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setDescription(event.target.value);
                  } }
                  placeholder='Give a detailed description of the issue. Include any error messages and what you have done so far to try and solve this.'
                  id="outlined-input"
                  fullWidth />
              </div>

              <div>
                <Typography className={styles.text} variant="subtitle1">
                  Tags (you must choose at least one)
                </Typography>
                <Select
                  multiple
                  fullWidth
                  required
                  displayEmpty
                  value={tagList as unknown as string}
                  onChange={handleChange}
                  input={<OutlinedInput />}
                  renderValue={(selected) => {

                    return (selected as unknown as string[]).join(', ');
                  } }
                  inputProps={{ 'aria-label': 'Without label' }}
                >
                  {tags.map((tag) => (
                    <MenuItem key={tag} value={tag}>
                      {tag}
                    </MenuItem>
                  ))}
                </Select>
              </div>

              <div>
                <FormControlLabel control={<Checkbox checked={isClusterable} onChange={() => setIsClusterable(!isClusterable)} />} label="Allow for clustering similar requests?" />
              </div>

              <div className={styles.buttonContainer}>
                <Button onClick={() => router.push('/dashboard')} className={styles.backButton} variant='contained' size='medium'>Back to Dashboard</Button>
                <Button onClick={handleSubmit} className={styles.createButton} variant='contained' size='medium'>Create Request</Button>
              </div>
            </CardContent>
          </Card>
        </Box>
      </div>
    </>

  );
}
