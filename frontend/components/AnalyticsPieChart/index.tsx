import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AnalyticsPieChart({ data, chartTitle }: any) {
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
    maintainAspectRatio: false
  };

  return (
    <Pie
      data={{
        labels: data.labels ? data.labels : [],
        datasets: data.datasets ? data.datasets : [],
      }}
      width={100}
      height={50}
      options={options}
    />
  );
}
