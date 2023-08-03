import React, { useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import style from './QueueSettings.module.css';
import TextField from '@mui/material/TextField';
import { FormGroup, Box, Typography, Button, Card } from '@mui/material';
import SwitchToggles from '../SwitchToggles';
import SyphonDatePicker from '../SyphonDatePicker';
import SyphonTimePicker from '../SyphonTimePicker';
import FAQs from '../FAQs';
import { authenticatedGetFetch, authenticatedPostFetch, authenticatedPutFetch, toCamelCase } from '../../utils';
import TagsSelection from '../TagsSelection';
import { Tag } from '../../types/requests';
import { useRouter } from 'next/router';

import QueueCard from '../QueueCard';

type QueueSettingsProps = {
  courseOfferingId: string | string[] | undefined;
  queueId?: string | string[] | undefined;
  isEdit: boolean;
};

type QueueCreationInfo = {
  date: Dayjs;
  startTime: Dayjs;
  endTime: Dayjs;
  tags: Tag[];
  tagSelection: Tag[];
  isVisible: boolean;
  isAvailable: boolean;
  isTimeLimit: boolean;
  title: string;
  timeLimit: number;
  announcement: string;
};

const QueueSettings = ({ courseOfferingId, queueId, isEdit }: QueueSettingsProps) => {
  const [date, setDate] = useState<Dayjs>(dayjs(new Date()));
  const [startTime, setTimeStart] = useState<Dayjs>(dayjs(new Date()));
  const [endTime, setTimeEnd] = useState<Dayjs>(dayjs(new Date()).add(2, 'hour'));
  const [tags, setTags] = useState<Tag[]>([{ tagId: 1, name: 'A tag', isPriority: false }]);
  const [tagSelection, setTagSelection] = useState<Tag[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isTimeLimit, setIsTimeLimit] = useState(false);
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(0);
  const [course, setCourse] = useState('');
  const [error, setError] = useState<{ title?: string, tags?: string }>({});
  const [announcement, setAnnouncement] = useState<string>('');

  const [toBeCreatedList, setToBeCreatedList] = useState<QueueCreationInfo[]>([]);

  const router = useRouter();

  useEffect(() => {
    if (!isEdit || !queueId) return;
    const fetchQueue = async () => {
      const res = await authenticatedGetFetch('/queue/get', { queue_id: queueId as string });
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
      const res = await authenticatedGetFetch('/queue/tags', { queue_id: queueId as string });
      const data = await res.json();
      setTagSelection(toCamelCase(data));
    };
    fetchQueue();
    fetchQueueTags();
  }, [queueId, isEdit]);

  useEffect(() => {
    const fetchCourse = async () => {
      const res = await authenticatedGetFetch('/course/get', { course_id: courseOfferingId as string });
      // TODO: this type is incorrect
      const data: { course_code: string } = await res.json();
      setCourse(data.course_code);
    };

    const fetchTags = async () => {
      const res = await authenticatedGetFetch('/course/tags', { course_id: courseOfferingId as string });
      const data = await res.json();
      setTags(toCamelCase(data));
    };

    if (!courseOfferingId) return;
    fetchCourse();
    fetchTags();
  }, [courseOfferingId]);

  const handleCreateAll = async () => {
    const body = toBeCreatedList.map(q => {
      return {
        title: q.title,
        start_time: q.startTime.format('YYYY-MM-DDTHH:mm:ss'),
        end_time: q.endTime.format('YYYY-MM-DDTHH:mm:ss'),
        tags: q.tagSelection?.map((tag) => ({
          tag_id: tag.tagId,
          is_priority: !!tag.isPriority,
          name: tag.name,
        })),
        is_visible: q.isVisible,
        is_available: q.isAvailable,
        time_limit: q.timeLimit,
        announcement: q.announcement,
        course_id: Number.parseInt(courseOfferingId as string),
      };
    });
    await authenticatedPostFetch('/queue/bulk_create', body);
    router.push(`/course/${courseOfferingId}`);
  };

  const [indexInBulkList, setIndexInBulkList] = useState<number | undefined>(undefined);

  const handleAddAnother = () => {
    if (title === '') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return setError({ title: 'Title cannot be empty' });
    }
    if (tagSelection.length === 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return setError({ tags: 'Tags cannot be empty' });
    }
    setDataInBulkList(true);
    resetCurrentQueueData();
  };

  const resetCurrentQueueData = () => {
    setDate(dayjs(new Date()));
    setTimeStart(dayjs(new Date()));
    setTimeEnd(dayjs(new Date()).add(2, 'hour'));
    setTags([{ tagId: 1, name: 'A tag', isPriority: false }]);
    setTagSelection([]);
    setIsVisible(true);
    setIsAvailable(true);
    setIsTimeLimit(false);
    setTitle('');
    setTimeLimit(0);
    setCourse('');
    setError({});
    setAnnouncement('');
  };

  const redirectToCardInBulkList = (e: any, idx: number) => {
    e.stopPropagation();
    // Save current changes to the list if not been added
    if (indexInBulkList !== undefined) {
      setDataInBulkList();
    }
    // load data from idx
    const data = toBeCreatedList[idx];
    setDate(data.date);
    setTimeStart(data.startTime);
    setTimeEnd(data.endTime);
    setTags(data.tags);
    setTagSelection(data.tagSelection);
    setIsVisible(data.isVisible);
    setIsAvailable(data.isAvailable);
    setIsTimeLimit(data.isTimeLimit);
    setTitle(data.title);
    setTimeLimit(data.timeLimit);
    setAnnouncement(data.announcement);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIndexInBulkList(idx);
  };

  const setDataInBulkList = (forceNewQueue?: boolean) => {
    const data = constructBulkListData();
    if (indexInBulkList === undefined || forceNewQueue) {
      setToBeCreatedList(prev => [...prev, data]);
    } else {
      setToBeCreatedList(prev => [...prev.slice(0, indexInBulkList), data, ...prev.slice(indexInBulkList + 1)]);
    }
  };
  const constructBulkListData = (): QueueCreationInfo => {
    return {
      date,
      startTime,
      endTime,
      tags,
      tagSelection,
      isVisible,
      isAvailable,
      isTimeLimit,
      title,
      timeLimit,
      announcement,
    };
  };

  const handleSaveChanges = async () => {
    if (title === '') {
      setError({ title: 'Title cannot be empty' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tagSelection.length === 0) {
      setError({ tags: 'Tags cannot be empty' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setError({});
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
    if (!res.ok) {
      console.log(res);
    }
    router.push(`/active-queue/${queueId}`);
  };


  console.log('toBeCreatedList.length', toBeCreatedList.length);

  return (
    <>
      <div className={style.container}>
        <Box className={style.cardBox}>
          <Card className={style.cardContainer}>
            {isEdit ? <Typography variant="h5" className={style.pageTitle}>Edit Queue for {course}</Typography>
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
            <SyphonDatePicker date={date} setDate={setDate} />
            <Typography variant="body1" className={style.title}>Time</Typography>
            <SyphonTimePicker
              timeStart={startTime}
              setTimeStart={setTimeStart}
              timeEnd={endTime}
              setTimeEnd={setTimeEnd}
            />
            <Typography variant='body1' className={style.title}>Tags (you must choose at least one)</Typography>
            <TagsSelection tagSelection={tagSelection} tags={tags} setTagSelection={setTagSelection} isCreator />
            {error.tags && <Typography width='100%' maxWidth={1000} variant='body2' color='error'>{error.tags}</Typography>}
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
              <FAQs courseOfferingId={courseOfferingId} tutor={true} />
            </div>
            {isEdit ?
              <Button variant="contained" className={style.button} onClick={handleSaveChanges}>Save Changes</Button>
              : (<>
                <span>
                  <Button variant="contained" className={style.button} onClick={handleAddAnother}>Add as New Queue</Button>
                </span>
              </>
              )}
          </Card>
        </Box>
        <div style={{ marginTop: '1.5rem' }} />
        <Box className={style.cardBox}>
          <Card className={style.cardContainer}>
            {
              !isEdit && (
                <>
                  <Typography variant="h5" className={style.pageTitle}>Queues to be Created:</Typography>
                </>
              )
            }
            {!isEdit &&
              <div className={style.cards}> {
                toBeCreatedList.map((q, idx) => <QueueCard
                  key={idx}
                  title={q.title}
                  queueId={0}
                  location={['Online']}
                  courseAdmins={['John Smith']}
                  isEdit={false}
                  isTutor={true}
                  overrideRedirect={(e) => redirectToCardInBulkList(e, idx)}
                />)}
              </div>
            }
            {!isEdit &&
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                }}
              >
                <div style={{
                  display: 'flex',
                  margin: '1rem'
                }}>
                  <Button
                    variant="contained"
                    className={style.button}
                    onClick={handleCreateAll}
                    disabled={toBeCreatedList.length <= 0}
                    style={{ margin: 'auto' }}
                  >
                    Create All & Finish
                  </Button>
                </div>
              </div>
            }
          </Card>
        </Box>
      </div>
    </>
  );
};

export default QueueSettings;

