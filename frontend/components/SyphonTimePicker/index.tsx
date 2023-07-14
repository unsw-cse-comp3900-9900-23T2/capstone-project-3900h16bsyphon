import React from 'react';
import { FormGroup, Typography } from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import pageStyle from '../../pages/create-queue/[courseid]/CreateQueue.module.css';
import { Dayjs } from 'dayjs';
import style from './SyphonTimePicker.module.css';

type SyphonTimePickerProps = {
    timeStart: Dayjs,
    setTimeStart: React.Dispatch<React.SetStateAction<Dayjs>>,
    timeEnd: Dayjs, 
    setTimeEnd: React.Dispatch<React.SetStateAction<Dayjs>>,
}

const SyphonTimePicker = (props: SyphonTimePickerProps) => {
  return (
    <div className={style.timePicker}>
      <FormGroup className={pageStyle.formGroup} row={true}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <TimePicker
            label="Time Start"
            value={props.timeStart}
            onChange={(newValue) => newValue && props.setTimeStart(newValue) }
          />
          <TimePicker
            label="Time End"
            value={props.timeEnd}
            onChange={(newValue) => newValue && props.setTimeEnd(newValue) }
          />
        </LocalizationProvider>
      </FormGroup>
    </div>
  );
};

export default SyphonTimePicker;
