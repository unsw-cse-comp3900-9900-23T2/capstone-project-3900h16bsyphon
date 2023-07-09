import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Typography, 
  Button,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import styles from './CreateRequest.module.css';
import { useRouter } from 'next/router';
import { authenticatedPostFetch, authenticatedGetFetch, toCamelCase } from '../../../utils';
import TagsSelection from '../../../components/TagsSelection';
import Header from '../../../components/Header';
import { Tag } from '../../../types/requests';
import TagBox from '../../../components/TagBox';
import { QuestionMark } from '@mui/icons-material';

const MIN_TITLE = 5;

const MIN_DESCRIPTION = 50;

export default function CreateRequest() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [titleWordCount, setTitleWordCount] = useState(0);
  const [description, setDescription] = useState('');
  const [descriptionWordCount, setDescriptionWordCount] = useState(0);
  const [isClusterable, setIsClusterable] = useState(false);
  const [tagSelection, setTagSelection] = useState<Tag[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagHistory, setTagHistory] = useState<Record<string, number>>({});

  const handleSubmit = async () => {
    const body = {
      title: title,
      description: description,
      is_clusterable: isClusterable,
      status: 'Unseen',
      tags: tagSelection.map((tag) => tag.tagId),
      queue_id: Number.parseInt(`${router.query.queueid}`),
    };
    let res = await authenticatedPostFetch('/request/create', body);
    let value = toCamelCase(await res.json());
    if (res.ok) router.push(`/wait/${value.requestId}`);
  };

  useEffect(() => {
    const fetchTags = async () => {
      const res = await authenticatedGetFetch('/queue/tags', {queue_id: `${router.query.queueid}`});
      const data = await res.json();
      setTags(toCamelCase(data));
    };
    const fetchPreviousRequests = async () => {
      const res = await authenticatedGetFetch('/history/request_details', {queue_id: `${router.query.queueid}`});
      const data = toCamelCase(await res.json());
      let tags: Record<string, number> = {};
      for (let request of data) {
        request.tags.forEach((tag: string) => {
          if (tags[tag]) {
            tags[tag] += 1;
          } else {
            tags[tag] = 1;
          }
        });
      }
      setTagHistory(tags);
    };
    if (!router.query.queueid) return;
    fetchTags();
    fetchPreviousRequests();
  }, [router.query.queueid]);

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
      <Header/>
      <div className={styles.pageContainer}>
        <Box className={styles.cardBox}>
          <Card className={styles.cardContainer}>
            <div className={styles.cardHeader}>
              <Typography variant="h4">
                Create Request
              </Typography>
            </div>
            <TagBox
              text={(
                <div className={styles.tagBox}>
                  <QuestionMark className={styles.question} />
                  <div className={styles.nestedTagBox}>
                    <Typography variant='h6'>Request History</Typography>
                    <Typography> {
                      Object.keys(tagHistory).length === 0 ?
                        'you have no previous requests for this course. Happy first question!':
                        'You have previously submitted' + Object.keys(tagHistory).map((tag: string) => ` ${tagHistory[tag]} request${tagHistory[tag] === 1 ? '': 's'} for '${tag}'`).join('and ') + '.'
                    } </Typography>
                  </div>
                </div>
              )}
              backgroundColor="var(--colour-main-purple-200)"
              color="var(--colour-main-purple-900)"
            />
            <CardContent className={styles.cardContent}>
              <div>
                <div className={styles.headingWordCount}>
                  <Typography variant="subtitle1">
                    Title
                  </Typography>
                  <Typography variant="subtitle1">
                    {(MIN_TITLE - titleWordCount) < 0 ? 0 : MIN_TITLE - titleWordCount} more words required
                  </Typography>
                </div>
                <TextField
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
                  <Typography variant="subtitle1">
                    Description
                  </Typography>
                  <Typography variant="subtitle1">
                    {(MIN_DESCRIPTION - descriptionWordCount) < 0 ? 0 : MIN_DESCRIPTION - descriptionWordCount} more words required
                  </Typography>
                </div>
                <TextField
                  multiline
                  rows={4}
                  value={description}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setDescription(event.target.value);
                  }}
                  placeholder='Give a detailed description of the issue. Include any error messages and what you have done so far to try and solve this.'
                  id="outlined-input"
                  fullWidth />
              </div>
              <TagsSelection tagSelection={tagSelection} tags={tags} setTagSelection={setTagSelection} color='black' backgroundColor='#e3e3e3' />
              <FormControlLabel
                control={<Checkbox checked={isClusterable} onChange={() => setIsClusterable(!isClusterable)} />}
                label="Allow for clustering similar requests?"
              />
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
