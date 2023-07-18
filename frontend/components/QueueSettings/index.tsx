import React, { useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import style from './QueueSettings.module.css';
import TextField from '@mui/material/TextField';
import { FormGroup, Box, Typography, Button, Card} from '@mui/material';
import SwitchToggles from '../SwitchToggles';
import SyphonDatePicker from '../SyphonDatePicker';
import SyphonTimePicker from '../SyphonTimePicker';
import FAQs from '../FAQs';
import { authenticatedGetFetch, authenticatedPostFetch, authenticatedPutFetch, toCamelCase } from '../../utils';
import TagsSelection from '../TagsSelection';
import Header from '../Header';
import { Tag } from '../../types/requests';
import { useRouter } from 'next/router';
import useAuthenticatedWebSocket from '../../hooks/useAuthenticatedWebSocket';


type QueueSettingsProps = {
    courseOfferingId: string | string[] | undefined;
    queueId?: string | string[] | undefined;
    isEdit: boolean;
};

const QueueSettings = ({courseOfferingId, queueId, isEdit } : QueueSettingsProps ) => {
  const [date, setDate] = useState<Dayjs>(dayjs(new Date()));
  const [startTime, setTimeStart] = useState<Dayjs>(dayjs(new Date()));
  const [endTime, setTimeEnd] = useState<Dayjs>(dayjs(new Date()).add(2, 'hour'));
  const [tags, setTags] = useState<Tag[]>([{tagId: 1, name: 'A tag', isPriority: false}]);
  const [tagSelection, setTagSelection] = useState<Tag[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isTimeLimit, setIsTimeLimit] = useState(false);
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(0);
  const [course, setCourse] = useState('');
  const [error, setError] = useState<{title?: string}>({});
  const [announcement, setAnnouncement] = useState<string>('');

  const router = useRouter();
  
  useEffect(() => {
    if (!isEdit || !queueId) return;
    const fetchQueue = async () => {
      const res = await authenticatedGetFetch('/queue/get', {queue_id: queueId as string});
      const data = await res.json();
      const queue = toCamelCase(data);
      setDate(dayjs(queue.startTime));
      setTimeStart(dayjs(queue.startTime));
      setTimeEnd(dayjs(queue.endTime));
      setIsVisible(queue.isVisible);
      setIsAvailable(queue.isAvailable);
      setIsTimeLimit(queue.isTimeLimit);
      setTitle(queue.title);
      setTimeLimit(queue.timeLimit);
      setAnnouncement(queue.announcement);
    };
    const fetchQueueTags = async () => {
      const res = await authenticatedGetFetch('/queue/tags', {queue_id: queueId as string});
      const data = await res.json();
      setTagSelection(toCamelCase(data));
    };
    fetchQueue();
    fetchQueueTags();
  }, [queueId, isEdit]);

  useEffect(() => {
    const fetchCourse = async () => {
      const res = await authenticatedGetFetch('/course/get', {course_id: courseOfferingId as string});
      // TODO: this type is incorrect
      const data: {course_code: string} = await res.json();
      setCourse(data.course_code);
    };

    const fetchTags = async () => {
      const res = await authenticatedGetFetch('/course/tags', {course_id: courseOfferingId as string});
      const data = await res.json();
      setTags(toCamelCase(data));
    };

    if (!courseOfferingId) return;
    fetchCourse();
    fetchTags();
  }, [courseOfferingId]);

  const handleCreate = async () => {
    if (title === '') {
      setError({title: 'Title cannot be empty'});
      return;
    }
    const body = {
      title,
      start_time: startTime.format('YYYY-MM-DDTHH:mm:ss'),
      end_time: endTime.format('YYYY-MM-DDTHH:mm:ss'),
      tags: tagSelection?.map((tag) => ({
        tag_id: tag.tagId,
        is_priority: !!tag.isPriority,
        name: tag.name,
      })),
      is_visible: isVisible,
      is_available: isAvailable,
      time_limit: timeLimit,
      announcement,
      course_id: Number.parseInt(courseOfferingId as string),
    };
    let res = await authenticatedPostFetch('/queue/create', body);
    let data = await res.json();
    router.push(`/active-queue/${data.queue_id}`);
  };

  const handleSaveChanges = async () => {
    if (title === '') {
      setError({title: 'Title cannot be empty'});
      return;
    }
    const body = {
      queue_id: Number.parseInt(queueId as string),
      title: title,
      start_time: startTime.format('YYYY-MM-DDTHH:mm:ss'),
      end_time: endTime.format('YYYY-MM-DDTHH:mm:ss'),
      tags: tagSelection?.map((tag) => ({
        tag_id: tag.tagId,
        is_priority: tag.isPriority,
        name: tag.name,
      })),
      is_visible: isVisible,
      is_available: isAvailable,
      time_limit: timeLimit,
      announcement: announcement,
      course_id: Number.parseInt(courseOfferingId as string),
    };
    let res = await authenticatedPutFetch('/queue/update', body);
    console.log(body);
    if (!res.ok) {
      console.log(res);
    }
    router.push(`/active-queue/${queueId}`);
  };



  return (
    <>
      <Header/>
      <div className={style.container}> 
        <Box className={style.cardBox}>
          <Card className={style.cardContainer}>
            {isEdit? <Typography variant="h5" className={style.pageTitle}>Edit Queue for {course}</Typography>
              : <Typography variant="h5" className={style.pageTitle}>Create a new Queue for {course}</Typography>
            }
            <Typography variant="body1" className={style.title}>Queue Title</Typography>
            <FormGroup className={style.formGroup}>
              <TextField
                value={title}
                placeholder="Name this queue"
                onChange={(e) => setTitle(e.target.value)}
                variant='outlined'
                fullWidth
                className={style.textField}
                error={!!error.title}
                helperText={error.title}
              />
            </FormGroup>
            <Typography variant="body1" className={style.title}>Date</Typography>
            <SyphonDatePicker date={date} setDate={setDate}/>
            <Typography variant="body1" className={style.title}>Time</Typography>
            <SyphonTimePicker 
              timeStart={startTime} 
              setTimeStart={setTimeStart} 
              timeEnd={endTime} 
              setTimeEnd={setTimeEnd} 
            />
            <Typography variant='body1' className={style.title}>Tags (you must choose at least one)</Typography>
            <TagsSelection tagSelection={tagSelection} tags={tags} setTagSelection={setTagSelection} isCreator />
            <Typography variant="body1" className={style.title}>Announcement (optional) </Typography>
            <FormGroup className={style.formGroup}>
              <TextField
                value={announcement}
                placeholder="e.g. we'll prioritise questions about assignment 1"
                onChange={(e) => setAnnouncement(e.target.value)}
                variant='outlined'
                fullWidth
                multiline
                rows={2}
              />
            </FormGroup>
            <SwitchToggles 
              isAvailable={isAvailable} 
              setIsAvailable={setIsAvailable}
              isVisible={isVisible}
              setIsVisible={setIsVisible}
              isTimeLimit={isTimeLimit}
              setIsTimeLimit={setIsTimeLimit}
              timeLimit={timeLimit}
              setTimeLimit={setTimeLimit}
            />
            <div className={style.faq}>
              <FAQs courseOfferingId={courseOfferingId} tutor={true}/>
            </div>
            {isEdit? <Button variant="contained" className={style.button} onClick={handleSaveChanges}>Save Changes</Button> 
              : <Button variant="contained" className={style.button} onClick={handleCreate}>Create Queue</Button>}
          </Card>
        </Box>
      </div>
    </>
  );
};
export default QueueSettings;

