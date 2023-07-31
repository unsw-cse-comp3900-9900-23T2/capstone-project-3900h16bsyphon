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
};

export default function AnalyticsLineGraph({ range }: AnalyticsLineGraphProps) {
  // render consultation demand title and correct labels
  let text: string = 'Consultation demand breakdown';
  let labels: string[] = [];

  if (range?.from) {
    if (!range.to) {
      text = `Consultation demand breakdown for ${format(range.from, 'PPP')}`;
      labels = [format(range.from, 'dd/MM/yyyy')];
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
        borderColor: '#6F7CB2',
        backgroundColor: '#6F7CB2',
      },
      {
        label: 'Total number of students seen',
        data: [4, 2, 4, 20, 5],
        borderColor: '#C7C7C7',
        backgroundColor: '#C7C7C7',
      },
      {
        label: 'Total number of students unseen',
        data: [6, 2, 7, 8, 9],
        borderColor: '#F4BC4D',
        backgroundColor: '#F4BC4D',
      },
      {
        label: 'Average wait time',
        data: [10, 2, 5, 0, 10],
        borderColor: '#EDB392',
        backgroundColor: '#EDB392',
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
