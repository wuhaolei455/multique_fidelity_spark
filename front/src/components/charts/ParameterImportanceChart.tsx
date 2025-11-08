/**
 * 参数重要性图表组件
 */

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import type { ParameterImportance } from '@/types';

interface ParameterImportanceChartProps {
  data: ParameterImportance[];
  height?: number;
}

const ParameterImportanceChart: React.FC<ParameterImportanceChartProps> = ({
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

    // 按重要性排序
    const sortedData = [...data].sort((a, b) => b.importance - a.importance);

    const option: EChartsOption = {
      title: {
        text: '参数重要性',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: '重要性',
      },
      yAxis: {
        type: 'category',
        data: sortedData.map((item) => item.parameter),
        axisLabel: {
          interval: 0,
          rotate: 0,
        },
      },
      series: [
        {
          name: '重要性',
          type: 'bar',
          data: sortedData.map((item) => item.importance),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' },
            ]),
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}',
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

export default ParameterImportanceChart;

