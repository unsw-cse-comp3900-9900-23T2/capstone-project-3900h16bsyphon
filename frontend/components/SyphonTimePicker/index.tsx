import React, { useState } from 'react';
import { FormGroup, Typography } from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import style from './SyphonTimePicker.module.css';
import pageStyle from '../../pages/queue-creation/queue-creation.module.css';
import { Dayjs } from 'dayjs';

type SyphonTimePickerProps = {
    timeStart: Dayjs | null,
    setTimeStart: (timeStart: Dayjs | null) => void,
    timeEnd: Dayjs | null,
    setTimeEnd: (timeEnd: Dayjs | null) => void,
}

const SyphonTimePicker = (props: SyphonTimePickerProps) => {
    return (
        <FormGroup className={pageStyle.formGroup} row={true}>
                <Typography variant="body1">Time</Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                    label="Time Start"
                    value={props.timeStart}
                    onChange={(newValue) => props.setTimeStart(newValue)}
                    defaultValue={props.timeEnd}
                    sx={{marginLeft: "25px"}}
                />
                <TimePicker
                    label="Time End"
                    value={props.timeEnd}
                    onChange={(newValue) => props.setTimeEnd(newValue)}
                    defaultValue={props.timeEnd}
                />
                </LocalizationProvider>
        </FormGroup>
    )
}

export default SyphonTimePicker;