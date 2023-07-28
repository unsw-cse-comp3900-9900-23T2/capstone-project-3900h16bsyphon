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
import { ChartData } from '../../types/charts';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type AnalyticsBarChartProps = {
  data: ChartData;
  chartTitle: string;
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

  return (
    <Bar
      options={options}
      data={{
        labels: data.labels ? data.labels : [],
        datasets: data.datasets ? data.datasets : [],
      }}
    />
  );
};

export default AnalyticsBarChart;
