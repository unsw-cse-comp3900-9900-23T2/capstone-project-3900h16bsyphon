import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { ChartData, Dataset } from '../../types/charts';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

export const data1 = {
  labels,
  datasets: [
    {
      label: 'Minutes',
      data: labels.map(() => 3),
      backgroundColor: '#D5CFFF', // doesn't let me use global css vars here
    },
  ],
};

type AnalyticsBarChartProps = {
  data: ChartData,
  chartTitle: string
};

const AnalyticsBarChart = ({ data, chartTitle }: AnalyticsBarChartProps) => {

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: chartTitle,
      },
    },
  };

  return <Bar options={options} data={data} />;
};

export default AnalyticsBarChart;
