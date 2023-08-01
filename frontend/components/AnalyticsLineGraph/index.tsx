import React, { useState } from 'react';
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
import dayjs, { Dayjs } from 'dayjs';
import { authenticatedGetFetch, createTimeInterval, toCamelCase } from '../../utils';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Button } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import styles from './AnalyticsLineGraph.module.css';
import router from 'next/router';
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
  courseId: string | string[] | undefined;
};

export default function AnalyticsLineGraph({ courseId }: AnalyticsLineGraphProps) {
  const [consultationAnalytics, setConsultationAnalytics] = useState<ConsultationAnalytics>();
  const [startTime, setStartTime] = useState<Dayjs | null>(dayjs(new Date()));
  const [endTime, setEndTime] = useState<Dayjs | null>(dayjs(new Date()).add(2, 'hour'));
  let text: string = `Consultation demand breakdown between ${startTime?.format('MMMM D, YYYY h:mm A')} - ${endTime?.format('MMMM D, YYYY h:mm A')}`;

  const timeArr = createTimeInterval(startTime, endTime);
  let labels: string[] = timeArr.map((time) => time);
  
  const handleSubmit = async () => {
    const res = await authenticatedGetFetch('/course/consultation_analytics', {
      start_time: startTime?.format('YYYY-MM-DDTHH:mm:ss') || '',
      end_time: endTime?.format('YYYY-MM-DDTHH:mm:ss') || '',
      course_id: `${router.query.courseid}`,
    });
    const d = await res.json();
    setConsultationAnalytics(toCamelCase(d));
  };

  const data = {
    labels,
    datasets: [
      {
        label: 'Time spent idle (mins)',
        data: consultationAnalytics?.map((c) => c.timeSpentIdle.minutes),
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
        label: 'Average wait time (mins)',
        data: consultationAnalytics?.map((c) => c.avgWaitTime.minutes),
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

  return (
    <div className={styles.container}>
      <div className={styles.calendarContainer}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateTimePicker
            label="Start time"
            value={startTime}
            onChange={(time) => setStartTime(time)}
          />
          <DateTimePicker
            label="End time"
            value={endTime}
            onChange={(time) => setEndTime(time)}
          />
        </LocalizationProvider>
        <Button onClick={handleSubmit} className={styles.submitBtn}>Submit</Button>
      </div>
      <div className={styles.lineGraphContainer}>
        <Line options={options} data={data} />
      </div>
    </div>
  );
}
