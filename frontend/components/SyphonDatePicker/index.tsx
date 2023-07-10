import React from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers';
import { FormGroup, Typography } from '@mui/material';

import { Dayjs } from 'dayjs';

import style from './SyphonDatePicker.module.css';
import pageStyle from '../../pages/create-queue/[courseid]/CreateQueue.module.css';

type DatePickerProps = {
    date: Dayjs,
    setDate: React.Dispatch<React.SetStateAction<Dayjs>>,
}

const SyphonDatePicker = ({date, setDate}: DatePickerProps) => {
  return (
    <div className={style.datePicker}>
      <Typography variant="body1" className={style.label}>Date</Typography>
      <FormGroup className={pageStyle.formGroup} row={true}> 
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            value={date}
            onChange={(e) => e && setDate(e) }
            format="ddd, DD/MM/YYYY"
          />
        </LocalizationProvider>
      </FormGroup>
    </div>
  );
};

export default SyphonDatePicker;
