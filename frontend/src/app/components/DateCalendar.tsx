'use client'
import React, {useState} from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';

type DateCalendarProps = {
    label: string;
}
export default function DateCalendarValue(props: DateCalendarProps) {
  const [value, setValue] = useState<Dayjs | null>(dayjs(new Date()));

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateCalendar value={value} onChange={(newValue) => setValue(newValue)} />
          
    </LocalizationProvider>
  );
}