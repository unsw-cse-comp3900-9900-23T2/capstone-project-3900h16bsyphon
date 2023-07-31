import Typography from '@mui/material/Typography';
import { addDays, format } from 'date-fns';
import { useState } from 'react';
import { DateRange, DayPicker } from 'react-day-picker';

const pastMonth = new Date();

export default function AnalyticsCalendar() {
  const defaultSelected: DateRange = {
    from: pastMonth,
    to: addDays(pastMonth, 4)
  };
  const [range, setRange] = useState<DateRange | undefined>(defaultSelected);

  let footer = <p>Please pick the first day.</p>;

  if (range?.from) {
    if (!range.to) {
      footer = (<div>
        <p>Consultation demand summary for {format(range.from, 'PPP')}</p>
        <li>Time spent idle:</li>
        <li>Total number of students seen:</li>
        <li>Total number of students unseen:</li>
        <li>Average wait time:</li>
      </div>);
    } else if (range.to) {
      footer = (
        <div>
          <p>Consultation demand summary between {format(range.from, 'PPP')} – {format(range.to, 'PPP')}</p>
          <li>Time spent idle:</li>
          <li>Total number of students seen:</li>
          <li>Total number of students unseen:</li>
          <li>Average wait time:</li>
        </div>
      );
    }
  }

  return (
    <DayPicker
      id="test"
      mode="range"
      defaultMonth={pastMonth}
      selected={range}
      footer={footer}
      onSelect={setRange}
    />
  );
}
