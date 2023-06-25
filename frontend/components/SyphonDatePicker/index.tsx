import React, { useState } from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar, DateField } from '@mui/x-date-pickers';
import { FormGroup, Typography } from '@mui/material';

import dayjs, { Dayjs } from 'dayjs';

import style from './SyphonDatePicker.module.css';
import pageStyle from '../../pages/queue-creation/queue-creation.module.css';

type DatePickerProps = {
    date: Dayjs | null,
    setDate: (date: Dayjs | null) => void,
}

const SyphonDatePicker = ({date, setDate}: DatePickerProps) => {
    return (
        <FormGroup className={pageStyle.formGroup} row={true}> 
            <Typography variant="body1">Date</Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateField 
                    value={date}
                    onChange={(e) => {setDate(e)}}
                    defaultValue={date}
                    size="small"
                    sx={{width: "130px", marginLeft: "30px", marginRight: "0"}}
                    format="DD/MM/YYYY"
                />
                <DateCalendar
                    value={date}
                    defaultValue={date}
                    onChange={(e) => {setDate(e)}}
                    openTo="day"
                    maxDate={dayjs(new Date()).add(1, 'year')}
                    minDate={dayjs(new Date())}
                    className={style.dateCalendar}
                />
            </LocalizationProvider>
        </FormGroup>
    )
}


export default SyphonDatePicker;