import { ECharts } from '@wuba/react-native-echarts';

export default function MyChart() {
  const option = {
    title: { text: 'ECharts in React Native' },
    tooltip: {},
    xAxis: { data: ['A', 'B', 'C'] },
    yAxis: {},
    series: [{ type: 'bar', data: [5, 20, 36] }],
  };

  return <ECharts option={option} />;
}
