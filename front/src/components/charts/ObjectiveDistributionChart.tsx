/**
 * 目标值分布图表组件
 */

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

interface ObjectiveDistributionChartProps {
  data: number[];
  height?: number;
}

const ObjectiveDistributionChart: React.FC<ObjectiveDistributionChartProps> = ({
  data,
  height = 400,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    // 初始化图表
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // 计算直方图数据
    const bins = 20;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins;
    const histogram = new Array(bins).fill(0);
    console.log('data', data);

    data.forEach((value) => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      histogram[binIndex]++;
    });

    const binLabels = histogram.map((_, i) => {
      const start = min + i * binWidth;
      const end = start + binWidth;
      return `${start.toFixed(2)}-${end.toFixed(2)}`;
    });

    const option: EChartsOption = {
      title: {
        text: '目标值分布',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          const param = params[0];
          return `${param.name}<br/>数量: ${param.value}`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: binLabels,
        axisLabel: {
          rotate: 45,
          interval: Math.floor(bins / 10),
        },
        name: '目标值范围',
        nameLocation: 'middle',
        nameGap: 50,
      },
      yAxis: {
        type: 'value',
        name: '频次',
        nameLocation: 'middle',
        nameGap: 40,
      },
      series: [
        {
          name: '分布',
          type: 'bar',
          data: histogram,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#2378f7' },
              { offset: 1, color: '#83bff6' },
            ]),
          },
        },
      ],
    };

    chartInstance.current.setOption(option);

    // 响应式调整
    const handleResize = () => {
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      // 先移除事件监听器，再销毁图表实例
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [data]);

  return <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />;
};

export default ObjectiveDistributionChart;

