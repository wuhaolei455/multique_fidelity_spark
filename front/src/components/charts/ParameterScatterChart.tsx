/**
 * 参数散点图组件
 */

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

interface ParameterScatterChartProps {
  data: {
    parameterName: string;
    values: Array<{ x: number; y: number }>;
  };
  height?: number;
}

const ParameterScatterChart: React.FC<ParameterScatterChartProps> = ({
  data,
  height = 400,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data.values.length) return;

    // 初始化图表
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const scatterData = data.values.map((item) => [item.x, item.y]);

    const option: EChartsOption = {
      title: {
        text: `${data.parameterName} vs 目标值`,
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${data.parameterName}: ${params.value[0].toFixed(2)}<br/>目标值: ${params.value[1].toFixed(2)}`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: data.parameterName,
        nameLocation: 'middle',
        nameGap: 30,
      },
      yAxis: {
        type: 'value',
        name: '目标值',
        nameLocation: 'middle',
        nameGap: 50,
      },
      series: [
        {
          name: data.parameterName,
          type: 'scatter',
          data: scatterData,
          symbolSize: 8,
          itemStyle: {
            color: '#5470c6',
            opacity: 0.7,
          },
          emphasis: {
            itemStyle: {
              color: '#ee6666',
              borderColor: '#333',
              borderWidth: 2,
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

export default ParameterScatterChart;

