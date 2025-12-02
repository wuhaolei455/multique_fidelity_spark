/**
 * 性能曲线图组件（带改进注释）
 */

import React, { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption, TooltipComponentOption } from 'echarts';
import type { CallbackDataParams } from 'echarts/types/dist/shared';
import type { Observation } from '@/types';

interface PerformanceChartProps {
  data: {
    iterations: number[];
    objectives: number[];
    bestObjectives?: number[];
  };
  showBest?: boolean;
  height?: number;
  observations?: Observation[];
  improvementThreshold?: number;
  regressionThreshold?: number;
  diffLimit?: number;
}

const DEFAULT_DIFF_LIMIT = 3;

const formatValue = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : value.toFixed(3);
  }
  return String(value);
};

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  showBest = true,
  height = 400,
  observations,
  improvementThreshold,
  regressionThreshold,
  diffLimit = DEFAULT_DIFF_LIMIT,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const bestSeries = useMemo(() => {
    if (data.bestObjectives && data.bestObjectives.length === data.objectives.length) {
      return data.bestObjectives;
    }
    const series: number[] = [];
    data.objectives.forEach((value, idx) => {
      if (idx === 0) {
        series.push(value);
      } else {
        series.push(Math.min(series[idx - 1], value));
      }
    });
    return series;
  }, [data.bestObjectives, data.objectives]);

  const deltaToBest = useMemo(
    () => data.objectives.map((value, idx) => Number((value - bestSeries[idx]).toFixed(6))),
    [data.objectives, bestSeries],
  );

  const thresholdConfig = useMemo(() => {
    const objectiveRange =
      data.objectives.length > 0
        ? Math.max(...data.objectives) - Math.min(...data.objectives)
        : 0;
    const improvementCutoff =
      improvementThreshold ?? Math.max(objectiveRange * 0.05, 0.001);
    const regressionCutoff =
      regressionThreshold ?? Math.max(objectiveRange * 0.03, 0.001);
    return { improvementCutoff, regressionCutoff };
  }, [data.objectives, improvementThreshold, regressionThreshold]);

  const trendAnnotations = useMemo(() => {
    const improvementSegments: Array<{ startIdx: number; endIdx: number; delta: number }> = [];
    const regressionPoints: Array<{
      iteration: number;
      value: number;
      drop: number;
      dataIndex: number;
    }> = [];
    let previousBest = bestSeries[0] ?? 0;

    bestSeries.forEach((bestValue, idx) => {
      if (idx === 0) {
        previousBest = bestValue;
        return;
      }
      if (previousBest - bestValue >= thresholdConfig.improvementCutoff) {
        improvementSegments.push({
          startIdx: Math.max(0, idx - 1),
          endIdx: idx,
          delta: previousBest - bestValue,
        });
      }
      previousBest = Math.min(previousBest, bestValue);
    });

    data.objectives.forEach((objective, idx) => {
      if (idx === 0) return;
      const drop = objective - data.objectives[idx - 1];
      if (drop >= thresholdConfig.regressionCutoff) {
        regressionPoints.push({
          iteration: data.iterations[idx],
          value: objective,
          drop,
          dataIndex: idx,
        });
      }
    });

    return { improvementSegments, regressionPoints };
  }, [bestSeries, data.iterations, data.objectives, thresholdConfig]);

  const configDiffSummaries = useMemo(() => {
    if (!observations || observations.length === 0) {
      return [];
    }
    const summaries: Array<{ total: number; snippets: string[] } | null> = data.iterations.map(
      () => null,
    );
    const maxIndex = Math.min(observations.length, data.iterations.length);

    for (let idx = 1; idx < maxIndex; idx += 1) {
      const prev = observations[idx - 1];
      const current = observations[idx];
      if (!prev || !current) continue;
      const prevConfig = prev.config || {};
      const currConfig = current.config || {};
      const keys = new Set([...Object.keys(prevConfig), ...Object.keys(currConfig)]);
      const snippets: string[] = [];
      let totalChanges = 0;
      keys.forEach((key) => {
        const before = prevConfig[key];
        const after = currConfig[key];
        if (before !== after) {
          totalChanges += 1;
          if (snippets.length < diffLimit) {
            snippets.push(`${key}: ${formatValue(before)} → ${formatValue(after)}`);
          }
        }
      });
      if (totalChanges > 0) {
        summaries[idx] = {
          total: totalChanges,
          snippets,
        };
      }
    }

    return summaries;
  }, [observations, data.iterations, diffLimit]);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const deltaMin = deltaToBest.length ? Math.min(...deltaToBest) : 0;
    const deltaMax = deltaToBest.length ? Math.max(...deltaToBest) : 1;
    const visualMap = {
      show: false,
      dimension: 2,
      min: deltaMin,
      max: deltaMax === deltaMin ? deltaMin + 1e-6 : deltaMax,
      inRange: {
        color: ['#0f9d58', '#fbbf24', '#d93025'],
      },
    };

    const regressionLookup = new Map<number, { drop: number }>();
    trendAnnotations.regressionPoints.forEach((point) => {
      regressionLookup.set(point.dataIndex, { drop: point.drop });
    });

    const series: any[] = [
      {
        name: '每次迭代',
        type: 'line',
        data: data.iterations.map((iter, idx) => [iter, data.objectives[idx], deltaToBest[idx]]),
        encode: { x: 0, y: 1 },
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: 'auto',
        },
        markArea:
          trendAnnotations.improvementSegments.length > 0
            ? {
                silent: true,
                itemStyle: {
                  color: 'rgba(16, 185, 129, 0.15)',
                },
                data: trendAnnotations.improvementSegments.map((segment) => [
                  {
                    name: `显著提升 -Δ${segment.delta.toFixed(2)}`,
                    xAxis: data.iterations[segment.startIdx],
                  },
                  {
                    xAxis: data.iterations[segment.endIdx],
                  },
                ]),
              }
            : undefined,
        markPoint:
          trendAnnotations.regressionPoints.length > 0
            ? {
                symbol: 'triangle',
                symbolRotate: 180,
                itemStyle: { color: '#d94e5d' },
                data: trendAnnotations.regressionPoints.map((point) => ({
                  coord: [point.iteration, point.value],
                  value: `+${point.drop.toFixed(2)}`,
                })),
              }
            : undefined,
      },
    ];

    if (showBest && bestSeries.length) {
      series.push({
        name: '最佳值',
        type: 'line',
        data: data.iterations.map((iter, idx) => [iter, bestSeries[idx]]),
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          type: 'dashed',
        },
      });
    }

    const tooltipFormatter: NonNullable<TooltipComponentOption['formatter']> = (params) => {
      const paramArray = Array.isArray(params) ? params : [params];
      if (!paramArray.length) return '';

      const point =
        (paramArray.find((item) => item.seriesName === '每次迭代') ?? paramArray[0]) as CallbackDataParams;
      const idx = point.dataIndex ?? 0;
      const iteration = data.iterations[idx] ?? 0;
      const objective = data.objectives[idx] ?? 0;
      const best = bestSeries[idx];
      const delta = deltaToBest[idx] ?? 0;
      const lines = [
        `迭代: ${iteration}`,
        `目标值: ${objective.toFixed(4)}`,
        `当前最佳: ${best?.toFixed(4) ?? '-'}`,
        `距最佳: ${delta.toFixed(4)}`,
      ];
      const regressionInfo = regressionLookup.get(idx);
      if (regressionInfo) {
        lines.push(`⚠️ 大幅回退: +${regressionInfo.drop.toFixed(4)}`);
      }
      const diffSummary = configDiffSummaries[idx];
      if (diffSummary) {
        lines.push(`配置变化 (${diffSummary.total})：`);
        diffSummary.snippets.forEach((snippet) => lines.push(snippet));
      } else {
        lines.push('配置变化: 无');
      }
      return lines.join('<br/>');
    };

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
        formatter: tooltipFormatter,
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
      visualMap,
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

    chartInstance.current.setOption(option, { notMerge: true });

    const handleResize = () => {
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [
    data.iterations,
    data.objectives,
    showBest,
    bestSeries,
    deltaToBest,
    trendAnnotations,
    configDiffSummaries,
  ]);

  return <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />;
};

export default PerformanceChart;

