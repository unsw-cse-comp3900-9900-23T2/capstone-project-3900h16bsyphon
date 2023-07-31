import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DateRange } from 'react-day-picker';
import { format, eachDayOfInterval } from 'date-fns';
import { Dayjs } from 'dayjs';
import { createTimeInterval } from '../../utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type AnalyticsLineGraphProps = {
  range: DateRange | undefined;
  startTime: Dayjs;
  endTime: Dayjs;
};

export default function AnalyticsLineGraph({ range, startTime, endTime }: AnalyticsLineGraphProps) {
  const start = startTime.format('h:mm A');
  const end = endTime.format('h:mm A');

  // render consultation demand title and correct labels
  let text: string = 'Consultation demand breakdown';
  let labels: string[] = [];

  // create interval time arr separated by hour
  const timeArr = createTimeInterval(startTime, endTime);

  if (range?.from && startTime.isBefore(endTime)) {
    if (!range.to) {
      text = `Consultation demand breakdown for ${format(range.from, 'PPP')} between ${start} - ${end}`;
      labels = timeArr.map((time) => time);
    } else if (range.to) {
      text = `Consultation demand breakdown between ${format(
        range.from,
        'PPP'
      )} – ${format(range.to, 'PPP')}`;
      labels = eachDayOfInterval({
        start: range.from,
        end: range.to,
      }).map((d) => format(d, 'dd/MM/yyyy'));
    }
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'Time spent idle',
        data: [1, 2, 3, 4, 5],
        borderColor: '#BCD1F4',
        backgroundColor: '#BCD1F4',
      },
      {
        label: 'Total number of students seen',
        data: [4, 2, 4, 20, 5],
        borderColor: '#D3D3D3',
        backgroundColor: '#D3D3D3',
      },
      {
        label: 'Total number of students unseen',
        data: [6, 2, 7, 8, 9],
        borderColor: '#E9E6FD',
        backgroundColor: '#E9E6FD',
      },
      {
        label: 'Average wait time',
        data: [10, 2, 5, 0, 10],
        borderColor: '#EDB6B6',
        backgroundColor: '#EDB6B6',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${text}`,
      },
    },
    scales: {
      x: {
        offset: true,
      },
    },
  };

  return <Line options={options} data={data} />;
}
