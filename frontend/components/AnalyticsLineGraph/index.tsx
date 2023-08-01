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
import { ConsultationAnalytics } from '../../types/courses';

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
  consultationAnalytics?: ConsultationAnalytics;
};

export default function AnalyticsLineGraph({ startTime, endTime, consultationAnalytics }: AnalyticsLineGraphProps) {
  // render consultation demand title and correct labels
  let text: string = `Consultation demand breakdown between ${startTime?.format('MMMM D, YYYY h:mm A')} - ${endTime?.format('MMMM D, YYYY h:mm A')}`;

  console.log(consultationAnalytics);
  // create interval time arr separated by hour
  const timeArr = createTimeInterval(startTime, endTime);
  let labels: string[] = timeArr.map((time) => time);
  
  const data = {
    labels,
    datasets: [
      {
        label: 'Time spent idle',
        data: consultationAnalytics?.map((x) => x.timeSpentIdle),
        borderColor: '#BCD1F4',
        backgroundColor: '#BCD1F4',
      },
      {
        label: 'Total number of students unseen',
        data: consultationAnalytics?.map((x) => x.numStudentsUnseen),
        borderColor: '#E9E6FD',
        backgroundColor: '#E9E6FD',
      },
      {
        label: 'Total number of students seen',
        data: consultationAnalytics?.map((x) => x.numStudentsSeen),
        borderColor: '#D3D3D3',
        backgroundColor: '#D3D3D3',
      },
      {
        label: 'Average wait time',
        data: consultationAnalytics?.map((x) => x.avgWaitTime),
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
