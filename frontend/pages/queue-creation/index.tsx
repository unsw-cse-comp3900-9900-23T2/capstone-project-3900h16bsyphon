/* eslint-disable no-unused-vars */
import React, {useState} from 'react';
import dayjs, { Dayjs } from 'dayjs';
import style from './queue-creation.module.css';
import TextField from '@mui/material/TextField';
import { FormGroup, Box, Typography, Button, Card} from '@mui/material';
import SyphonDatePicker from '../../components/SyphonDatePicker';
import SwitchToggles from '../../components/SwitchToggles';
import SyphonTimePicker from '../../components/SyphonTimePicker';
import FAQs from '../../components/FAQs';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Tags from '../../components/Tags';
import { getToken } from '../../utils';

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
  const [course, setCourse] = useState('COMP1521');

  const submit = async () => {
    const body = { date, timeStart, timeEnd, tags, isVisible, isAvailable, isTimeLimit, title, course };
    
    console.log('hi');
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL}/queue-creation/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
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

