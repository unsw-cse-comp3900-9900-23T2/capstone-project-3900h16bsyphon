import styles from './CreateRequestCard.module.css';
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
import { useRouter } from 'next/router';
import { authenticatedPostFetch, authenticatedGetFetch, toCamelCase, authenticatedPutFetch } from '../../utils';
import TagsSelection from '../TagsSelection';
import { Tag } from '../../types/requests';
import TagBox from '../TagBox';
import { QuestionMark } from '@mui/icons-material';


type CreateRequestCardProps = {
  isEditMode: boolean;
  queueId?: number;
  requestId?: number;
};

const MIN_TITLE = 5;
const MIN_DESCRIPTION = 50;

const CreateRequestCard = ({ isEditMode, queueId, requestId }: CreateRequestCardProps) => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [titleWordCount, setTitleWordCount] = useState(0);
  const [description, setDescription] = useState('');
  const [descriptionWordCount, setDescriptionWordCount] = useState(0);
  const [isClusterable, setIsClusterable] = useState(false);
  const [tagSelection, setTagSelection] = useState<Tag[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagHistory, setTagHistory] = useState<Record<string, number>>({});
  const [currentQueueId, setCurrentQueueId] = useState(queueId);

  useEffect(() => {
    const getRequestData = async () => {
      const res = await authenticatedGetFetch('/request/get_info', { request_id: `${requestId}` });
      if (!res.ok) {
        console.error('authentication failed, or something broke with fetching request in CreateRequestCard, check network tab');
        return;
      }
      const requestInfo = toCamelCase(await res.json());
      setTitle(requestInfo.title);
      setDescription(requestInfo.description);
      setIsClusterable(requestInfo.isClusterable);
      setTagSelection(requestInfo.tags);
      setCurrentQueueId(requestInfo.queueId);
    };
    // only want to fetch the request information if card is in edit mode
    if (isEditMode) getRequestData();
  }, [requestId, isEditMode]);

  useEffect(() => {
    const fetchTags = async () => {
      const res = await authenticatedGetFetch('/queue/tags', {queue_id: `${currentQueueId}`});
      const data = await res.json();
      setTags(toCamelCase(data));
    };
    const fetchPreviousRequests = async () => {
      const res = await authenticatedGetFetch('/history/previous_tags', {queue_id: `${currentQueueId}`});
      setTagHistory(await res.json());
    };
    if (!currentQueueId) return;
    fetchTags();
    fetchPreviousRequests();
  }, [currentQueueId]);

  const generateHistoryText = () => {
    if (Object.keys(tagHistory).length === 0) {
      return 'you have no previous requests for this course. Happy first question!';
    }
    return 'You have previously submitted:' +
    Object.keys(tagHistory).map(
      (tag: string) => ` ${tagHistory[tag]} request${tagHistory[tag] === 1 ? '': 's'} for "${tag}"`
    ).join(' and ') +
    '.';
  };

  const handleCreateRequestSubmit = async () => {
    const body = {
      title: title,
      description: description,
      is_clusterable: isClusterable,
      status: 'Unseen',
      tags: tagSelection.map((tag) => tag.tagId),
      queue_id: Number.parseInt(`${currentQueueId}`),
    };
    let res = await authenticatedPostFetch('/request/create', body);
    let value = toCamelCase(await res.json());
    if (res.ok) router.push(`/wait/${value.requestId}`);
  };

  const handleEditRequestSubmit = async () => {
    const body = {
      request_id: requestId,
      title: title,
      description: description,
      is_clusterable: isClusterable,
      status: 'Unseen',
      tags: tagSelection.map((tag) => tag.tagId),
      queue_id: Number.parseInt(`${currentQueueId}`),
    };
    let res = await authenticatedPutFetch('/request/edit', body);
    if (res.ok) router.push(`/wait/${requestId}`);
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

  return <>
    <Box className={styles.cardBox}>
      <Card className={styles.cardContainer}>
        <div className={styles.cardHeader}>
          <Typography variant="h4">
            {isEditMode ? 'Edit' : 'Create'} Request
          </Typography>
        </div>
        <TagBox
          text={(
            <div className={styles.tagBox}>
              <QuestionMark className={styles.questionIcon} />
              <div className={styles.nestedTagBox}>
                <Typography variant='h6'>Request History</Typography>
                <Typography> {generateHistoryText()} </Typography>
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
              }}
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
            <Button onClick={() => router.back()} className={styles.backButton} variant='contained' size='medium'>Back</Button>
            <Button onClick={isEditMode ? handleEditRequestSubmit : handleCreateRequestSubmit} className={styles.createButton} variant='contained' size='medium'>{isEditMode ? 'Edit' : 'Create'} Request</Button>
          </div>
        </CardContent>
      </Card>
    </Box>
  </>;
};

export default CreateRequestCard;