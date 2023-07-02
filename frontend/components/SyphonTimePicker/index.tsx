/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */
import React, { useState } from 'react';
import { FormGroup, Typography } from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import pageStyle from '../../pages/create-queue/[courseid]/CreateQueue.module.css';
import { Dayjs } from 'dayjs';
import style from './SyphonTimePicker.module.css';

type SyphonTimePickerProps = {
    timeStart: Dayjs,
    setTimeStart: (timeStart: Dayjs) => void,
    timeEnd: Dayjs, 
    setTimeEnd: (timeEnd: Dayjs) => void,
}

const SyphonTimePicker = (props: SyphonTimePickerProps) => {
  return (
    <div className={style.timePicker}>
      <Typography variant="body1" className={style.label}>Time</Typography>
      <FormGroup className={pageStyle.formGroup} row={true}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <TimePicker
            label="Time Start"
            value={props.timeStart}
            onChange={(newValue) => {newValue && props.setTimeStart(newValue);}}
            defaultValue={props.timeEnd}
          />
          <TimePicker
            label="Time End"
            value={props.timeEnd}
            onChange={(newValue) => {newValue && props.setTimeEnd(newValue);}}
            defaultValue={props.timeEnd}
          />
        </LocalizationProvider>
      </FormGroup>
    </div>
  );
};

export default SyphonTimePicker;
