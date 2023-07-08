import React, { useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import style from './CreateQueue.module.css';
import TextField from '@mui/material/TextField';
import { FormGroup, Box, Typography, Button, Card} from '@mui/material';
import SyphonDatePicker from '../../../components/SyphonDatePicker';
import SwitchToggles from '../../../components/SwitchToggles';
import SyphonTimePicker from '../../../components/SyphonTimePicker';
import FAQs from '../../../components/FAQs';
import { authenticatedGetFetch, authenticatedPostFetch, toCamelCase } from '../../../utils';
import { useRouter } from 'next/router';
import TagsSelection from '../../../components/TagsSelection';
import Header from '../../../components/Header';
import { Tag } from '../../../types/requests';


const QueueCreationPage = () => {
  const [date, setDate] = useState<Dayjs>(dayjs(new Date()));
  const [timeStart, setTimeStart] = useState<Dayjs>(dayjs(new Date()));
  const [timeEnd, setTimeEnd] = useState<Dayjs>(dayjs(new Date()).add(2, 'hour'));
  const [tags, setTags] = useState<Tag[]>([{tagId: 1, name: 'A tag', isPriority: false}]);
  const [tagSelection, setTagSelection] = useState<Tag[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isTimeLimit, setIsTimeLimit] = useState(false);
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(0);
  const [course, setCourse] = useState('');
  // complaining about not using announcement, will do later.
  // eslint-disable-next-line
  const [announcement, _setAnnouncement] = useState<string>('hi');
  const router = useRouter();

  useEffect(() => {
    const fetchCourse = async () => {
      const res = await authenticatedGetFetch('/course/get', {course_id: `${router.query.courseid}`});
      // TODO: this type is incorrect
      const data: {course_code: string} = await res.json();
      setCourse(data.course_code);
    };

    const fetchTags = async () => {
      const res = await authenticatedGetFetch('/course/tags', {course_id: `${router.query.courseid}`});
      const data = await res.json();
      setTags(toCamelCase(data));
    };
    if (!router.query.courseid) return;
    fetchCourse();
    fetchTags();
  }, [router.query.courseid]);

  const submit = async () => {
    const body = {
      title,
      time_start: timeStart.format('YYYY-MM-DDTHH:mm:ss'),
      time_end: timeEnd.format('YYYY-MM-DDTHH:mm:ss'),
      tags: tagSelection.map((tag) => ({
        tag_id: tag.tagId,
        is_priority: !!tag.isPriority,
        name: tag.name,
      })),
      is_visible: isVisible,
      is_available: isAvailable,
      time_limit: timeLimit,
      announcement,
      course_id: Number.parseInt(`${router.query.courseid}`),
    };
    let res = await authenticatedPostFetch('/queue/create', body);
    let data = await res.json();
    router.push(`/active-queue/${data.queue_id}`);
  };
  return (
    <>
      <Header/>
      <div className={style.container}> 
        <Box className={style.cardBox}>
          <Card className={style.cardContainer}>
            <Typography variant="h5" className={style.pageTitle}>Create a new Queue for {course}</Typography>
            <Typography variant="body1" className={style.queueTitle}>Queue Title</Typography>
            <FormGroup className={style.formGroup}>
              <TextField
                value={title}
                placeholder="Name this queue"
                onChange={(e) => setTitle(e.target.value)}
                variant='outlined'
                fullWidth
                className={style.textField}
              />
            </FormGroup>
            <SyphonDatePicker date={date} setDate={setDate}/>
            <SyphonTimePicker 
              timeStart={timeStart} 
              setTimeStart={setTimeStart} 
              timeEnd={timeEnd} 
              setTimeEnd={setTimeEnd} 
            />
            <TagsSelection tagSelection={tagSelection} tags={tags} setTagSelection={setTagSelection} isCreator />
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

            <FAQs />
            <Button variant="contained" className={style.button} onClick={submit}>Create Queue</Button>
          </Card>
        </Box>
      </div>
    </>
  );
};
export default QueueCreationPage;

