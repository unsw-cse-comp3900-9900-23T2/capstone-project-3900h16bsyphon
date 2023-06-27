import { useState, ChangeEvent } from 'react';
import styles from './CreateCourseQueueModal.module.css';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const data = ['Hussain', 'Peter', 'Joanna'];

const CreateCourseOfferingModal = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [inputLength, setInputLength] = useState(0);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [admin, setAdmin] = useState('');
  const [date, setDate] = useState<Dayjs | null>(dayjs(new Date()));

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setInput('');
    setError(false);
    setErrorMsg('');
    setInputLength(0);
    setDate(dayjs(new Date()));
    setOpen(false);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    getWordCount(event.target.value);
    setInput(event.target.value);
  };

  const handleAdminChange = (event: ChangeEvent<HTMLInputElement>) => setAdmin(event.target.value);

  const validate = () => {
    if (inputLength >= 25) {
      setErrorMsg('Course title must be less than 25 words');
      return false;
    } else if (inputLength === 0) {
      setErrorMsg('Course title cannot be empty');
      return false;
    } else if (admin.length === 0) {
      setErrorMsg('Admin field cannot be empty');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    const validation = validate();
    setError(!validation);
    if (!validation) return;
    console.log(`input has gone through ${input} ${admin}`);
    handleClose();
  };

  const getWordCount = (value: string) => {
    if (value.trim() === '') {
      setInputLength(0);
      return;
    }
    const words = value.trim().split(/\s+/);
    setInputLength(words.length);
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
          {error && (
            <Alert severity="error">{errorMsg}</Alert>
          )}
          <div className={styles.courseTitle}>
            <p>Course title</p>
            <p>Word count: {inputLength}</p>
          </div>
          <TextField value={input} onChange={handleInputChange} multiline rows={4}/>
          <p>Start date</p>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DemoContainer components={['DatePicker']}>
              <DatePicker defaultValue={date ? date : undefined} onChange={(e) => setDate(e)} />
            </DemoContainer>
          </LocalizationProvider>
          <p>Admins</p>
          <Autocomplete
            multiple
            id="tags-standard"
            options={data}
            getOptionLabel={(option) => option}
            onChange={() => handleAdminChange(event as unknown as ChangeEvent<HTMLInputElement>)}
            renderInput={(params) => (
              <TextField
                {...params}
                onChange={handleAdminChange}
              />
            )}
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
