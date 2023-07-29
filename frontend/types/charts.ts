export type Dataset = {
  label: string,
  data: number[],
  backgroundColor: string,
};

export type ChartData = {
  labels?: string[],
  datasets?: Dataset[],
};
