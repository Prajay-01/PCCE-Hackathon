import React from 'react';
import { View, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Paragraph } from 'react-native-paper';

const screenWidth = Dimensions.get('window').width;

const GrowthChart = ({ analyticsData = [] }) => {
  // Process real analytics data to show platform-specific growth
  const processChartData = () => {
    if (analyticsData.length === 0) {
      // Show empty state with sample structure
      return {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{ data: [0, 0, 0, 0] }]
      };
    }

    // Group data by platform
    const platformData = {};
    analyticsData.forEach(data => {
      const platform = data.platform || 'unknown';
      platformData[platform] = {
        impressions: data.impressions || 0,
        engagement: data.engagement || 0,
        followers: data.followers || 0,
        posts: data.posts || 0
      };
    });

    // Create labels and data from platforms
    const labels = [];
    const values = [];

    Object.entries(platformData).forEach(([platform, metrics]) => {
      labels.push(platform.charAt(0).toUpperCase() + platform.slice(1));
      // Use engagement as the metric (you can change this)
      values.push(metrics.engagement);
    });

    // If we have data, show it; otherwise show sample
    if (values.length > 0 && values.some(v => v > 0)) {
      return {
        labels,
        datasets: [{ data: values }]
      };
    }

    // Fallback to week-based view if only one platform
    return {
      labels: ['This Week'],
      datasets: [{ data: [values[0] || 0] }]
    };
  };

  const data = processChartData();
  const hasData = analyticsData.length > 0 && data.datasets[0].data.some(v => v > 0);

  const chartConfig = {
    backgroundColor: '#1cc910',
    backgroundGradientFrom: '#eff3ff',
    backgroundGradientTo: '#efefef',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForLabels: {
      fontSize: 10
    }
  };

  return (
    <View>
      <BarChart
        data={data}
        width={screenWidth - 60}
        height={220}
        chartConfig={chartConfig}
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
        showValuesOnTopOfBars={true}
      />
      {!hasData && (
        <Paragraph style={{ textAlign: 'center', color: '#999', marginTop: 10 }}>
          Sync your social accounts to see real engagement data
        </Paragraph>
      )}
    </View>
  );
};

export default GrowthChart;
