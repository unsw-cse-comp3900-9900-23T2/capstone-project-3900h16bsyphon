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
  startTime: Dayjs | null;
  endTime: Dayjs | null;
};

export default function AnalyticsLineGraph({ startTime, endTime }: AnalyticsLineGraphProps) {
  // render consultation demand title and correct labels
  let text: string = `Consultation demand breakdown between ${startTime?.format('MMMM D, YYYY h:mm A')} - ${endTime?.format('MMMM D, YYYY h:mm A')}`;

  // create interval time arr separated by hour
  const timeArr = createTimeInterval(startTime, endTime);
  let labels: string[] = timeArr.map((time) => time);
  
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
