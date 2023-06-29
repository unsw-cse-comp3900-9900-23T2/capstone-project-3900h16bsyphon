/* eslint-disable no-unused-vars */
import React, {useState} from 'react';
import dayjs, { Dayjs } from 'dayjs';
import style from './queue-creation.module.css';
import TextField from '@mui/material/TextField';
import { FormGroup, Box, Typography, Button, Card} from '@mui/material';
import SyphonDatePicker from '../../../components/SyphonDatePicker';
import SwitchToggles from '../../../components/SwitchToggles';
import SyphonTimePicker from '../../../components/SyphonTimePicker';
import FAQs from '../../../components/FAQs';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Tags from '../../../components/Tags';
import { authenticatedPostFetch, getToken } from '../../../utils';
import { useRouter } from 'next/router';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3E368F',
    },
    secondary: {
      main: '#091133'
    }
  }
});

const QueueCreationPage = () => {
  const [date, setDate] = useState<Dayjs>(dayjs(new Date()));
  const [timeStart, setTimeStart] = useState<Dayjs>(dayjs(new Date()));
  const [timeEnd, setTimeEnd] = useState<Dayjs>(dayjs(new Date()).add(2, 'hour'));
  const [tags, setTags] = useState<string[]>(['Assignment', 'Lab']);
  const [isVisible, setIsVisible] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isTimeLimit, setIsTimeLimit] = useState(false);
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(0);
  const [course, setCourse] = useState('COMP1521');
  const [announcement, setAnnouncement] = useState<string>('hi');
  const router = useRouter();

  const submit = async () => {
    const body = {
      title: title,
      time_start: timeStart.format('YYYY-MM-DDTHH:mm:ss'),
      time_end: timeEnd.format('YYYY-MM-DDTHH:mm:ss'),
      tags: tags,
      is_visible: isVisible,
      is_available: isAvailable,
      time_limit: timeLimit,
      announcement: announcement,
      course_id: Number.parseInt(`${router.query.id}`),
    };
    let res = await authenticatedPostFetch('/queue/create', body);
    router.push(`/queue/${router.query.id}`);
  };
  return (
    <ThemeProvider theme={theme}>
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
            <Tags />
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
    </ThemeProvider>
  );
};
export default QueueCreationPage;

