import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, Title, Paragraph, Button, Avatar, Chip, ProgressBar, Surface, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchUserAnalytics, analyzeBestPostingTimes } from '../services/socialMediaService';

const screenWidth = Dimensions.get('window').width;

const InsightsScreen = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [engagementData, setEngagementData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [0, 0, 0, 0, 0, 0, 0]
    }]
  });
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [sentimentAnalysis, setSentimentAnalysis] = useState({
    positive: 0,
    neutral: 0,
    negative: 0,
  });
  const [growthMetrics, setGrowthMetrics] = useState([
    { label: 'Follower Growth', value: 0, target: 100, color: '#667eea' },
    { label: 'Engagement Rate', value: 0, target: 100, color: '#f093fb' },
    { label: 'Content Quality', value: 0, target: 100, color: '#43e97b' },
    { label: 'Posting Consistency', value: 0, target: 100, color: '#4facfe' },
  ]);
  const [trendingTopics, setTrendingTopics] = useState([]);

  useEffect(() => {
    if (user) {
      loadInsightsData();
    }
  }, [user]);

  const loadInsightsData = async () => {
    try {
      setLoading(true);
      
      const analyticsData = await fetchUserAnalytics(user.uid);

      if (analyticsData.length > 0) {
        // Calculate total metrics
        let totalFollowers = 0;
        let totalEngagements = 0;
        let totalImpressions = 0;
        let totalPosts = 0;

        analyticsData.forEach(data => {
          totalFollowers += data.followers || 0;
          totalEngagements += data.engagement || 0;
          totalImpressions += data.impressions || 0;
          totalPosts += data.posts || 0;
        });

        const engagementRate = totalImpressions > 0 
          ? ((totalEngagements / totalImpressions) * 100).toFixed(1)
          : 0;

        // Update engagement chart (mock weekly data based on overall engagement)
        const baseEngagement = parseFloat(engagementRate);
        setEngagementData({
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            data: [
              baseEngagement * 0.8,
              baseEngagement * 0.9,
              baseEngagement * 1.1,
              baseEngagement * 1.2,
              baseEngagement * 1.0,
              baseEngagement * 1.3,
              baseEngagement * 1.4
            ]
          }]
        });

        // Generate AI recommendations
        const bestTimes = analyzeBestPostingTimes(analyticsData);
        const recommendations = [
          {
            title: 'Optimal Posting Schedule',
            description: `Based on your audience activity, post between ${bestTimes[0] || '2-4 PM'}`,
            impact: 'high',
            icon: 'clock-time-four',
            color: '#667eea',
          },
          {
            title: 'Engagement Optimization',
            description: engagementRate > 5 
              ? `Great job! Your ${engagementRate}% engagement rate is above average`
              : `Your engagement rate is ${engagementRate}%. Try posting more interactive content`,
            impact: engagementRate > 5 ? 'high' : 'medium',
            icon: 'heart',
            color: '#f093fb',
          },
          {
            title: 'Content Consistency',
            description: totalPosts > 10 
              ? 'Maintain your posting frequency for sustained growth'
              : 'Post more consistently - aim for at least 3 posts per week',
            impact: 'medium',
            icon: 'calendar',
            color: '#4facfe',
          },
          {
            title: 'Cross-Platform Strategy',
            description: `You have ${analyticsData.length} platform${analyticsData.length > 1 ? 's' : ''} connected. Consider cross-posting for wider reach`,
            impact: 'medium',
            icon: 'share-variant',
            color: '#43e97b',
          },
        ];
        setAiRecommendations(recommendations);

        // Calculate sentiment (mock based on engagement)
        const positivePercent = Math.min(90, Math.floor(engagementRate * 10));
        setSentimentAnalysis({
          positive: positivePercent,
          neutral: Math.floor((100 - positivePercent) * 0.7),
          negative: Math.floor((100 - positivePercent) * 0.3),
        });

        // Update growth metrics
        const followerGrowth = Math.min(100, Math.floor((totalFollowers / 1000) * 10));
        const engagementMetric = Math.min(100, Math.floor(engagementRate * 10));
        const contentQuality = Math.min(100, Math.floor(engagementRate * 12));
        const postingConsistency = Math.min(100, Math.floor((totalPosts / 50) * 100));

        setGrowthMetrics([
          { label: 'Follower Growth', value: followerGrowth, target: 100, color: '#667eea' },
          { label: 'Engagement Rate', value: engagementMetric, target: 100, color: '#f093fb' },
          { label: 'Content Quality', value: contentQuality, target: 100, color: '#43e97b' },
          { label: 'Posting Consistency', value: postingConsistency, target: 100, color: '#4facfe' },
        ]);

        // Set trending topics based on performance
        setTrendingTopics([
          { topic: 'Your Top Content', score: contentQuality },
          { topic: 'Engagement Leaders', score: engagementMetric },
          { topic: 'Growing Followers', score: followerGrowth },
          { topic: 'Consistency Score', score: postingConsistency },
        ]);
      } else {
        // No data yet - show default recommendations
        setAiRecommendations([
          {
            title: 'Get Started',
            description: 'Connect your social media accounts to receive personalized insights',
            impact: 'high',
            icon: 'link',
            color: '#667eea',
          },
          {
            title: 'Build Your Presence',
            description: 'Once connected, we\'ll analyze your content and provide growth strategies',
            impact: 'medium',
            icon: 'chart-line',
            color: '#f093fb',
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#667eea" />
        <Paragraph style={{ marginTop: 10 }}>Analyzing your content...</Paragraph>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Growify AI</Title>
        <Paragraph style={styles.headerSubtitle}>@</Paragraph>
        <Button 
          mode="text" 
          textColor="#00D9C0"
          style={{ alignSelf: 'flex-end', marginTop: -40 }}
          onPress={loadInsightsData}
        >
          Refresh
        </Button>
      </View>

      <ScrollView style={styles.content}>
        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCardSmall}>
            <Card.Content>
              <Paragraph style={styles.metricLabelSmall}>Engagement</Paragraph>
              <Title style={styles.metricValueLarge}>
                {sentimentAnalysis.positive > 0 ? `${sentimentAnalysis.positive / 10}%` : '0.0%'}
              </Title>
            </Card.Content>
          </Card>
          <Card style={styles.metricCardSmall}>
            <Card.Content>
              <Paragraph style={styles.metricLabelSmall}>Followers</Paragraph>
              <Title style={styles.metricValueLarge}>—</Title>
            </Card.Content>
          </Card>
        </View>
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCardSmall}>
            <Card.Content>
              <Paragraph style={styles.metricLabelSmall}>Best Time</Paragraph>
              <Title style={styles.metricValueLarge}>—</Title>
            </Card.Content>
          </Card>
          <Card style={styles.metricCardSmall}>
            <Card.Content>
              <Paragraph style={styles.metricLabelSmall}>Next</Paragraph>
              <Title style={styles.metricValueLarge}>—</Title>
            </Card.Content>
          </Card>
        </View>

        {/* Engagement Timeline Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Engagement Timeline</Title>
            <LineChart
              data={engagementData}
              width={screenWidth - 60}
              height={200}
              chartConfig={{
                backgroundColor: '#1a1a1a',
                backgroundGradientFrom: '#1a1a1a',
                backgroundGradientTo: '#1a1a1a',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0, 217, 192, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(128, 128, 128, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: "#00D9C0"
                }
              }}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={false}
            />
          </Card.Content>
        </Card>
        
        {/* Tip Section */}
        <View style={styles.tipSection}>
          <Paragraph style={styles.tipText}>
            <Paragraph style={styles.tipLabel}>Tip: </Paragraph>
            Connect Instagram in Profile to unlock real insights.
          </Paragraph>
        </View>

      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        color="#000000"
        onPress={() => {}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#000000',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#808080',
    marginTop: 2,
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000000',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 15,
  },
  metricCardSmall: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    minHeight: 100,
  },
  metricLabelSmall: {
    fontSize: 14,
    color: '#808080',
    marginBottom: 8,
  },
  metricValueLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chartCard: {
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: '#FFFFFF',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    backgroundColor: '#00D9C0',
  },
  tipSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  tipText: {
    fontSize: 14,
    color: '#00D9C0',
    textAlign: 'center',
  },
  tipLabel: {
    fontWeight: 'bold',
    color: '#00D9C0',
  },
});

export default InsightsScreen;
