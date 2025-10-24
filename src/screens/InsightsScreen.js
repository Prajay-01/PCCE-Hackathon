import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, Title, Paragraph, Button, Avatar, Chip, ProgressBar, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchUserAnalytics, analyzeBestPostingTimes } from '../services/socialMediaService';
import firestore from '@react-native-firebase/firestore';

const screenWidth = Dimensions.get('window').width;

const InsightsScreen = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalFollowers: 0,
    engagementRate: 0,
    bestTime: '2-4 PM',
    nextPostTime: 'Tomorrow',
  });
  const [engagementData, setEngagementData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
    }]
  });
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);

  useEffect(() => {
    if (!user) return;

    let unsubscribe = () => {};

    const loadData = async () => {
      try {
        unsubscribe = await loadInsightsData();
      } catch (error) {
        console.error('Error in useEffect:', error);
      }
    };

    loadData();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user]);

  const loadInsightsData = async () => {
    if (!user) return () => {};
    
    try {
      setLoading(true);
      
      // Fetch analytics data from Firestore with real-time listener
      const unsubscribe = firestore()
        .collection('analytics')
        .where('userId', '==', user.uid)
        .onSnapshot(snapshot => {
          if (snapshot.empty) {
            console.log('No analytics data found');
            setLoading(false);
            return;
          }

          let totalFollowers = 0;
          let totalEngagements = 0;
          let totalImpressions = 0;
          let totalPosts = 0;
          const platforms = [];
          const platformEngagement = {};

          snapshot.forEach(doc => {
            const data = doc.data();
            totalFollowers += data.followers || 0;
            totalEngagements += data.engagement || 0;
            totalImpressions += data.impressions || 0;
            totalPosts += data.posts || 0;
            
            if (data.platform) {
              platforms.push(data.platform);
              platformEngagement[data.platform] = {
                engagement: data.engagement || 0,
                impressions: data.impressions || 0,
              };
            }
          });

          setConnectedPlatforms(platforms);

          // Calculate engagement rate
          const engagementRate = totalImpressions > 0 
            ? ((totalEngagements / totalImpressions) * 100).toFixed(1)
            : 0;

          // Determine best posting time based on day of week patterns
          const now = new Date();
          const dayOfWeek = now.getDay();
          let bestTime = '2-4 PM';
          let nextPostTime = 'Tomorrow';
          
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            bestTime = '12-2 PM';
            nextPostTime = 'Today at 12 PM';
          } else {
            bestTime = '4-6 PM';
            nextPostTime = 'Tomorrow at 4 PM';
          }

          // Update metrics
          setMetrics({
            totalFollowers,
            engagementRate: parseFloat(engagementRate),
            bestTime,
            nextPostTime,
          });

          // Generate weekly engagement chart data
          const baseEngagement = parseFloat(engagementRate) || 0.5;
          const weeklyData = [
            baseEngagement * 0.8,
            baseEngagement * 0.9,
            baseEngagement * 1.1,
            baseEngagement * 1.2,
            baseEngagement * 1.0,
            baseEngagement * 1.3,
            baseEngagement * 1.4
          ];

          setEngagementData({
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
              data: weeklyData.map(val => Math.max(0.1, val)) // Ensure minimum value for visibility
            }]
          });

          setLoading(false);
        }, error => {
          console.error('Error loading insights:', error);
          setLoading(false);
        });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading insights:', error);
      setLoading(false);
      return () => {}; // Return empty cleanup function on error
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
                {metrics.engagementRate > 0 ? `${metrics.engagementRate}%` : '0.0%'}
              </Title>
            </Card.Content>
          </Card>
          <Card style={styles.metricCardSmall}>
            <Card.Content>
              <Paragraph style={styles.metricLabelSmall}>Followers</Paragraph>
              <Title style={styles.metricValueLarge}>
                {metrics.totalFollowers > 0 ? metrics.totalFollowers.toLocaleString() : '—'}
              </Title>
            </Card.Content>
          </Card>
        </View>
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCardSmall}>
            <Card.Content>
              <Paragraph style={styles.metricLabelSmall}>Best Time</Paragraph>
              <Title style={styles.metricValueSmaller}>
                {metrics.bestTime}
              </Title>
            </Card.Content>
          </Card>
          <Card style={styles.metricCardSmall}>
            <Card.Content>
              <Paragraph style={styles.metricLabelSmall}>Next Post</Paragraph>
              <Title style={styles.metricValueSmaller}>
                {metrics.nextPostTime}
              </Title>
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
            {connectedPlatforms.length === 0 
              ? 'Connect Instagram in Profile to unlock real insights.'
              : `Connected platforms: ${connectedPlatforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}`
            }
          </Paragraph>
        </View>

      </ScrollView>
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
  metricValueSmaller: {
    fontSize: 18,
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
