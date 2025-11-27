/**
 * 性能曲线图组件
 */

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

interface PerformanceChartProps {
  data: {
    iterations: number[];
    objectives: number[];
    bestObjectives?: number[];
  };
  showBest?: boolean;
  height?: number;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  showBest = true,
  height = 400,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化图表
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const series: any[] = [
      {
        name: '每次迭代',
        type: 'line',
        data: data.iterations.map((iter, i) => [iter, data.objectives[i]]),
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
        },
      },
    ];

    if (showBest && data.bestObjectives) {
      series.push({
        name: '最佳值',
        type: 'line',
        data: data.iterations.map((iter, i) => [iter, data.bestObjectives![i]]),
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          type: 'dashed',
        },
      });
    }

    const option: EChartsOption = {
      title: {
        text: '性能曲线',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      legend: {
        data: showBest ? ['每次迭代', '最佳值'] : ['每次迭代'],
        bottom: 10,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: '迭代次数',
        nameLocation: 'middle',
        nameGap: 30,
      },
      yAxis: {
        type: 'value',
        name: '目标值',
        nameLocation: 'middle',
        nameGap: 50,
      },
      series,
      dataZoom: [
        {
          type: 'slider',
          show: true,
          xAxisIndex: 0,
          start: 0,
          end: 100,
        },
        {
          type: 'inside',
          xAxisIndex: 0,
          start: 0,
          end: 100,
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
  }, [data, showBest]);

  return <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />;
};

export default PerformanceChart;

