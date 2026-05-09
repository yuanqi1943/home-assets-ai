import { useEffect, useState } from 'react';
import { Spin, message, Empty, Card } from 'antd';
import { api } from '../api';
import * as echarts from 'echarts';

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [categoryCount, setCategoryCount] = useState<any[]>([]);
  const [categoryValue, setCategoryValue] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [topExpensive, setTopExpensive] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/stats/category-count'),
      api.get('/stats/category-value'),
      api.get('/stats/monthly-trend'),
      api.get('/stats/top-expensive'),
    ])
      .then(([c1, c2, mt, te]) => {
        setCategoryCount(c1.data);
        setCategoryValue(c2.data);
        setMonthlyTrend(mt.data);
        setTopExpensive(te.data);
      })
      .catch(() => message.error('加载统计失败'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!categoryCount.length) return;
    const chart = echarts.init(document.getElementById('chart-count')!);
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: categoryCount.map((d) => ({ name: d.categoryName, value: d.count })),
      }],
    });
    return () => chart.dispose();
  }, [categoryCount]);

  useEffect(() => {
    if (!categoryValue.length) return;
    const chart = echarts.init(document.getElementById('chart-value')!);
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c}' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: '60%',
        data: categoryValue.map((d) => ({ name: d.categoryName, value: d.totalValue })),
      }],
    });
    return () => chart.dispose();
  }, [categoryValue]);

  useEffect(() => {
    if (!monthlyTrend.length) return;
    const chart = echarts.init(document.getElementById('chart-trend')!);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['物品数量', '总金额'] },
      xAxis: { type: 'category', data: monthlyTrend.map((d) => d.month) },
      yAxis: [
        { type: 'value', name: '数量', position: 'left' },
        { type: 'value', name: '金额', position: 'right' },
      ],
      series: [
        { name: '物品数量', type: 'bar', data: monthlyTrend.map((d) => d.itemCount) },
        { name: '总金额', type: 'line', yAxisIndex: 1, data: monthlyTrend.map((d) => d.totalValue) },
      ],
    });
    return () => chart.dispose();
  }, [monthlyTrend]);

  useEffect(() => {
    if (!topExpensive.length) return;
    const chart = echarts.init(document.getElementById('chart-top')!);
    chart.setOption({
      tooltip: { trigger: 'axis', formatter: '{b}: ¥{c}' },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: topExpensive.map((d) => d.name).reverse() },
      series: [{
        type: 'bar',
        data: topExpensive.map((d) => d.price).reverse(),
        itemStyle: { color: '#5470c6' },
      }],
    });
    return () => chart.dispose();
  }, [topExpensive]);

  if (loading) return <Spin style={{ display: 'block', marginTop: 40, textAlign: 'center' }} />;

  const hasData = categoryCount.length || categoryValue.length || monthlyTrend.length;
  if (!hasData) return <Empty description="暂无统计数据" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="物品数量按分类分布" size="small">
        <div id="chart-count" style={{ width: '100%', height: 300 }} />
      </Card>
      <Card title="物品总金额按分类分布" size="small">
        <div id="chart-value" style={{ width: '100%', height: 300 }} />
      </Card>
      <Card title="近12个月趋势" size="small">
        <div id="chart-trend" style={{ width: '100%', height: 300 }} />
      </Card>
      <Card title="最贵重物品 Top5" size="small">
        <div id="chart-top" style={{ width: '100%', height: 250 }} />
      </Card>
    </div>
  );
}
