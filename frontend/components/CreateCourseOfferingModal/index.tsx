import { useEffect, useState } from 'react';
import styles from './CreateCourseQueueModal.module.css';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { authenticatedGetFetch, authenticatedPostFetch } from '../../utils';
import TextInput from '../TextInput';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';

type UserData = {
  first_name: string;
  last_name: string;
  zid: string;
}

const CreateCourseOfferingModal = () => {
  const [open, setOpen] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [error, setError] = useState({
    courseCode: '',
    courseTitle: '',
    date: '',
    admins: '',
  });
  const [admins, setAdmins] = useState<string[]>([]);
  const [date, setDate] = useState<Dayjs | null>(dayjs(new Date()));
  const [data, setData] = useState<UserData[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      let res = await authenticatedGetFetch('/user/list', {});
      if (!res.ok) {
        console.error('authentication failed, or something broke, check network tab');
        return;
      }
      let data = await res.json();
      setData(data);
    };
    fetchUsers();
  }, []);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setError({
      courseCode: '',
      courseTitle: '',
      date: '',
      admins: '',
    });
    setDate(dayjs(new Date()));
    setOpen(false);
  };

  const handleSubmit = async () => {
    let res = await authenticatedPostFetch('/course/create_offering', {
      course_code: courseCode,
      title: courseTitle,
      start_date: date?.add(dayjs().utcOffset(), 'minute').format('YYYY-MM-DD'),
      admins,
    });
    if (res.ok) {
      handleClose();
      return;
    }
    let data = await res.json();
    setError({
      courseCode: data.course_code,
      courseTitle: data.title,
      date: data.start_date,
      admins: data.admins,
    });
  };

  return (
    <div>
      <Button startIcon={<AddIcon />} className={styles.createOfferingBtn} onClick={handleOpen}>Create Offering</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="generate join invite modal"
        aria-describedby="generate join invite modal"
      >
        <div className={styles.container}>
          <div className={styles.titleContainer}>
            <h2 className={styles.title}>
              Generate course offering
            </h2>
            <IconButton onClick={handleClose} size="small"
              aria-label="close modal button">
              <CloseIcon />
            </IconButton>
          </div>
          <TextInput label='Course Code' value={courseCode} setValue={setCourseCode} error={error.courseCode} />
          <TextInput label='Course Title' value={courseTitle} setValue={setCourseTitle} error={error.courseTitle} />
          <FormControlLabel
            className={styles.formItem}
            control={
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  slotProps={{
                    textField: {
                      fullWidth: true, error: !!error.date, helperText: error.date
                    }
                  }}
                  defaultValue={date ? date : undefined}
                  onChange={(e) => setDate(e)}
                />
              </LocalizationProvider>
            }
            labelPlacement='top'
            label={<Typography className={styles.label}>Start Date</Typography>}
          />
          <FormControlLabel
            className={styles.formItem}
            control={
              <Autocomplete
                fullWidth
                multiple
                id="tags-standard"
                options={data?.map((option) => `${option.first_name} ${option.last_name} (${option.zid})`)}
                getOptionLabel={(option) => option}
                onChange={(_, value) => {
                  let matches = data?.filter((user) => {
                    let dataString = `${user.first_name} ${user.last_name} (${user.zid})`;
                    return value.includes(dataString);
                  });
                  setAdmins(matches?.map((user) => user.zid));
                }}
                renderInput={(params) => (<TextField {...params} fullWidth error={!!error.admins} helperText={error.admins} />)}
              />
            }
            labelPlacement='top'
            label={<Typography className={styles.label}>Admins</Typography>}
          />
          <Button onClick={handleSubmit} className={styles.createBtn}>
						Create course
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CreateCourseOfferingModal;
