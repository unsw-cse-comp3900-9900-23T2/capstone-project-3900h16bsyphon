/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */
import React, { useState } from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar, DateField, DatePicker } from '@mui/x-date-pickers';
import { FormGroup, Typography } from '@mui/material';

import dayjs, { Dayjs } from 'dayjs';

import style from './SyphonDatePicker.module.css';
import pageStyle from '../../pages/queue-creation/[id]/queue-creation.module.css';

type DatePickerProps = {
    date: Dayjs,
    setDate: (date: Dayjs) => void,
}

const SyphonDatePicker = ({date, setDate}: DatePickerProps) => {
  return (
    <div className={style.datePicker}>
      <Typography variant="body1" className={style.label}>Date</Typography>
      <FormGroup className={pageStyle.formGroup} row={true}> 
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            value={date}
            onChange={(e) => {e && setDate(e);}}
            defaultValue={date}
            format="ddd, DD/MM/YYYY"
          />
        </LocalizationProvider>
      </FormGroup>
    </div>
  );
};

export default SyphonDatePicker;
