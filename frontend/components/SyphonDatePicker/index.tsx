import React from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers';
import { FormGroup } from '@mui/material';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import dayjs, { Dayjs } from 'dayjs';

import style from './SyphonDatePicker.module.css';
import pageStyle from '../../pages/create-queue/[courseid]/CreateQueue.module.css';

type DatePickerProps = {
    date: Dayjs,
    setDate: React.Dispatch<React.SetStateAction<Dayjs>>,
}

const SyphonDatePicker = ({date, setDate}: DatePickerProps) => {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.tz.setDefault('Australia/Sydney');
  return (
    <div className={style.datePicker}>
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
