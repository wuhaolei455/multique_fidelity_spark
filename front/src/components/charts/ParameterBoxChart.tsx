/**
 * 参数箱线图组件
 */

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

interface ParameterBoxChartProps {
  data: Array<{
    name: string;
    values: number[];
  }>;
  height?: number;
}

const ParameterBoxChart: React.FC<ParameterBoxChartProps> = ({
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

    // 计算箱线图数据
    const boxData = data.map((item) => {
      const sorted = [...item.values].sort((a, b) => a - b);
      const q1Index = Math.floor(sorted.length * 0.25);
      const q2Index = Math.floor(sorted.length * 0.5);
      const q3Index = Math.floor(sorted.length * 0.75);

      return [
        sorted[0], // min
        sorted[q1Index], // Q1
        sorted[q2Index], // median
        sorted[q3Index], // Q3
        sorted[sorted.length - 1], // max
      ];
    });

    const option: EChartsOption = {
      title: {
        text: '参数值分布',
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const value = params.value;
          return `${params.name}<br/>
            最小值: ${value[0].toFixed(2)}<br/>
            Q1: ${value[1].toFixed(2)}<br/>
            中位数: ${value[2].toFixed(2)}<br/>
            Q3: ${value[3].toFixed(2)}<br/>
            最大值: ${value[4].toFixed(2)}`;
        },
      },
      grid: {
        left: '10%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.name),
        axisLabel: {
          rotate: 45,
          interval: 0,
        },
        boundaryGap: true,
        nameGap: 30,
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        name: '参数值',
        nameLocation: 'middle',
        nameGap: 50,
        splitLine: {
          show: true,
        },
      },
      series: [
        {
          name: 'boxplot',
          type: 'boxplot',
          data: boxData,
          itemStyle: {
            color: '#b8c5f2',
            borderColor: '#5470c6',
          },
          emphasis: {
            itemStyle: {
              color: '#e97d7d',
              borderColor: '#e97d7d',
            },
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

export default ParameterBoxChart;

