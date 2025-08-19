export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
}

export interface ChartConfig {
  title?: string;
  type?: string; // e.g. 'line', 'bar'
  labels: string[];
  datasets: ChartDataset[];
}
