import { DateRange, DayPicker } from 'react-day-picker';

const pastMonth = new Date();

type AnalyticsCalendarProps = {
  range: DateRange | undefined;
  onRangeChange: (newRange: DateRange | undefined) => void;
};

export default function AnalyticsCalendar({ range, onRangeChange }: AnalyticsCalendarProps) {
  return (
    <DayPicker
      id="test"
      mode="range"
      defaultMonth={pastMonth}
      selected={range}
      onSelect={onRangeChange}
      disableNavigation
    />
  );
}
