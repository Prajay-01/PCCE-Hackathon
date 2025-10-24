import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Card, Title, Paragraph, Button, Avatar, Chip, Divider, Surface } from 'react-native-paper';

import firestore from '@react-native-firebase/firestore'; // Import Firestore
import GrowthChart from '../components/GrowthChart';
import { useAuth } from '../context/AuthContext';
// fetchUserAnalytics is now replaced by the real-time listener
import { getConnectedAccounts, analyzeBestPostingTimes } from '../services/socialMediaService';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [metrics, setMetrics] = useState([
    { title: 'Total Views', value: '0', icon: 'eye', color: '#667eea', change: '+0%' },
    { title: 'Engagement', value: '0%', icon: 'heart', color: '#f093fb', change: '+0%' },
    { title: 'Followers', value: '0', icon: 'account-group', color: '#4facfe', change: '+0%' },
    { title: 'Posts', value: '0', icon: 'post', color: '#43e97b', change: '+0' },
  ]);
  const [insights, setInsights] = useState([]);
  const [topPosts, setTopPosts] = useState([]);

  useEffect(() => {
    if (!user) return;

    console.log("DashboardScreen: Starting to load data for user:", user.uid);
    setLoading(true);

    // Set a timeout to prevent infinite loading (reduced to 3 seconds)
    const loadingTimeout = setTimeout(() => {
      console.log("Dashboard loading timeout - showing default state");
      setLoading(false);
      setRefreshing(false);
      setInsights([
        { tip: 'Connect your social media accounts to start seeing insights', type: 'Getting Started', icon: 'link', color: '#667eea' },
        { tip: 'Once connected, we\'ll analyze your content performance', type: 'Info', icon: 'information', color: '#4facfe' },
      ]);
    }, 3000); // 3 second timeout (faster loading)

    // Set up a real-time listener for the user's analytics data
    const unsubscribe = firestore()
      .collection('analytics')
      .where('userId', '==', user.uid)
      .onSnapshot(async (querySnapshot) => {
        try {
          console.log("DashboardScreen: Received snapshot with", querySnapshot.docs.length, "documents");
          clearTimeout(loadingTimeout); // Clear timeout if data loads successfully
          const analyticsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Store analytics data for the chart
          setAnalyticsData(analyticsData);
          
          if (analyticsData.length > 0) {
            try {
              const accountsResult = await getConnectedAccounts(user.uid);
              const accounts = accountsResult.success ? accountsResult.accounts : [];
              processAnalyticsData(analyticsData, accounts);
            } catch (accountsError) {
              console.error("Error fetching accounts:", accountsError);
              processAnalyticsData(analyticsData, []);
            }
          } else {
            // Handle case with no analytics data
            setInsights([
              { tip: 'Connect your social media accounts to start seeing insights', type: 'Getting Started', icon: 'link', color: '#667eea' },
              { tip: 'Once connected, we\'ll analyze your content performance', type: 'Info', icon: 'information', color: '#4facfe' },
            ]);
            setTopPosts([]);
            setMetrics([
              { title: 'Total Views', value: '0', icon: 'eye', color: '#667eea', change: '+0%' },
              { title: 'Engagement', value: '0%', icon: 'heart', color: '#f093fb', change: '+0%' },
              { title: 'Followers', value: '0', icon: 'account-group', color: '#4facfe', change: '+0%' },
              { title: 'Posts', value: '0', icon: 'post', color: '#43e97b', change: '+0' },
            ]);
          }
        } catch (error) {
          console.error("Error processing analytics snapshot: ", error);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      }, (error) => {
        console.error("Error fetching analytics snapshot: ", error);
        clearTimeout(loadingTimeout);
        setLoading(false);
        setRefreshing(false);
      });

    // Cleanup function to unsubscribe from the listener when the component unmounts
    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, [user]);

  const processAnalyticsData = (analyticsData, accounts) => {
    // This logic is extracted from the old loadDashboardData function
    let totalImpressions = 0;
    let totalEngagements = 0;
    let totalPosts = 0;
    const postsArray = [];
    const followersByPlatform = {};

    analyticsData.forEach(data => {
      totalImpressions += data.impressions || 0;
      totalEngagements += data.engagement || 0;
      totalPosts += data.posts || 0;
      
      // Group followers by platform
      if (data.platform && data.followers) {
        followersByPlatform[data.platform] = (followersByPlatform[data.platform] || 0) + data.followers;
      }
      
      if (data.topPosts && data.topPosts.length > 0) {
        postsArray.push(...data.topPosts);
      }
    });

    const formatNumber = (num) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return num.toString();
    };

    // Map platform names to proper display names
    const platformDisplayNames = {
      'instagram': 'Instagram',
      'facebook': 'Facebook',
      'youtube': 'YouTube',
      'twitter': 'Twitter',
      'linkedin': 'LinkedIn',
      'tiktok': 'TikTok'
    };

    // Create followers breakdown text with proper formatting
    const followersBreakdown = Object.entries(followersByPlatform)
      .map(([platform, count]) => {
        const platformName = platformDisplayNames[platform.toLowerCase()] || 
                           platform.charAt(0).toUpperCase() + platform.slice(1);
        return `${platformName}: ${formatNumber(count)}`;
      })
      .join(' • ');

    const totalFollowers = Object.values(followersByPlatform).reduce((sum, count) => sum + count, 0);

    // Calculate engagement rate properly: (Total Engagements / Total Followers) * 100
    // This gives a more realistic engagement rate percentage
    const engagementRate = totalFollowers > 0 
      ? ((totalEngagements / totalFollowers) * 100).toFixed(1)
      : totalImpressions > 0 
        ? ((totalEngagements / totalImpressions) * 100).toFixed(1)
        : '0';

    setMetrics([
      { title: 'Total Views', value: formatNumber(totalImpressions), icon: 'eye', color: '#667eea', change: '+12%' },
      { title: 'Engagement', value: engagementRate + '%', icon: 'heart', color: '#f093fb', change: '+3.2%' },
      { title: 'Followers', value: formatNumber(totalFollowers), icon: 'account-group', color: '#4facfe', change: '+15%', breakdown: followersBreakdown },
      { title: 'Posts', value: totalPosts.toString(), icon: 'post', color: '#43e97b', change: '+' + Math.floor(totalPosts * 0.1) },
    ]);

    const sortedPosts = postsArray
      .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
      .slice(0, 3)
      .map((post, index) => {
        // Safely handle engagementRate - it might be a string or number
        let engagementDisplay = '0%';
        if (post.engagementRate !== undefined && post.engagementRate !== null) {
          const rate = typeof post.engagementRate === 'string' 
            ? parseFloat(post.engagementRate) 
            : post.engagementRate;
          engagementDisplay = !isNaN(rate) ? rate.toFixed(1) + '%' : '0%';
        }
        
        return {
          id: index + 1,
          title: post.caption ? post.caption.substring(0, 40) + '...' : 'Post ' + (index + 1),
          views: formatNumber(post.impressions || 0),
          engagement: engagementDisplay
        };
      });
    
    setTopPosts(sortedPosts.length > 0 ? sortedPosts : [
      { id: 1, title: 'No posts data available', views: '0', engagement: '0%' }
    ]);

    try {
      const bestTimes = analyzeBestPostingTimes(analyticsData);
      const avgEngagement = engagementRate;
      const accountsCount = accounts?.length || 0;
      
      setInsights([
        { tip: `Your best posting time is ${bestTimes[0] || '2-4 PM'} based on engagement data`, type: 'Timing', icon: 'clock-outline', color: '#f093fb' },
        { tip: `Average engagement rate of ${avgEngagement}% - ${avgEngagement > 5 ? 'Great performance!' : 'Room for improvement'}`, type: 'Engagement', icon: 'trending-up', color: '#00d2ff' },
        { tip: `You have ${accountsCount} platform${accountsCount !== 1 ? 's' : ''} connected. Consider cross-posting for wider reach.`, type: 'Strategy', icon: 'lightbulb-on', color: '#667eea' },
      ]);
    } catch (insightsError) {
      console.error("Error generating insights:", insightsError);
      setInsights([
        { tip: 'Connect your social media accounts to see personalized insights', type: 'Getting Started', icon: 'link', color: '#667eea' },
      ]);
    }
  };

  const onRefresh = React.useCallback(() => {
    // The onSnapshot listener handles updates automatically,
    // but we can set refreshing state for user feedback.
    setRefreshing(true);
    // The listener will automatically set refreshing to false when data is fetched.
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#667eea" />
        <Paragraph style={{ marginTop: 10 }}>Loading your dashboard...</Paragraph>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Growify AI</Title>
        <Paragraph style={styles.headerSubtitle}>
          @{user?.displayName?.toLowerCase().replace(/\s+/g, '') || user?.email?.split('@')[0] || 'user'}
        </Paragraph>
      </View>

      <View style={styles.content}>
        {/* Metrics Cards */}
        <Title style={styles.sectionTitle}>Performance Summary</Title>
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <Surface key={index} style={styles.metricCard} elevation={2}>
              <View style={styles.metricHeader}>
                <Avatar.Icon 
                  size={40} 
                  icon={metric.icon} 
                  style={{ backgroundColor: metric.color }} 
                />
                <Chip 
                  icon="arrow-up" 
                  style={styles.changeChip}
                  textStyle={{ fontSize: 10 }}
                >
                  {metric.change}
                </Chip>
              </View>
              <Paragraph style={styles.metricLabel}>{metric.title}</Paragraph>
              <Title style={styles.metricValue}>{metric.value}</Title>
              {metric.breakdown && (
                <Paragraph style={styles.metricBreakdown}>{metric.breakdown}</Paragraph>
              )}
            </Surface>
          ))}
        </View>

        <Divider style={styles.divider} />

        {/* AI Insights Panel */}
        <Title style={styles.sectionTitle}>🤖 AI Insights</Title>
        {insights.map((insight, index) => (
          <Card key={index} style={styles.insightCard} mode="elevated">
            <Card.Content style={styles.insightContent}>
              <View style={styles.insightHeader}>
                <Avatar.Icon 
                  size={36} 
                  icon={insight.icon} 
                  style={{ backgroundColor: insight.color }} 
                />
                <Chip style={styles.insightChip}>{insight.type}</Chip>
              </View>
              <Paragraph style={styles.insightText}>{insight.tip}</Paragraph>
            </Card.Content>
          </Card>
        ))}

        <Divider style={styles.divider} />

        {/* Growth Chart */}
        <Title style={styles.sectionTitle}>Growth Analytics</Title>
        <Card style={styles.chartCard}>
          <Card.Content>
            <GrowthChart analyticsData={analyticsData} />
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        {/* Top Performing Posts */}
        <Title style={styles.sectionTitle}>Top Performing Posts</Title>
        {topPosts.map((post) => (
          <Card key={post.id} style={styles.postCard} mode="elevated">
            <Card.Content>
              <Title style={styles.postTitle}>{post.title}</Title>
              <View style={styles.postStats}>
                <Chip icon="eye" style={styles.postChip}>{post.views} views</Chip>
                <Chip icon="heart" style={styles.postChip}>{post.engagement} engagement</Chip>
              </View>
            </Card.Content>
          </Card>
        ))}

        <Divider style={styles.divider} />

        {/* Quick Actions */}
        <Title style={styles.sectionTitle}>Quick Actions</Title>
        <View style={styles.actionsGrid}>
          <Button 
            mode="contained" 
            icon="plus" 
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
            onPress={() => navigation.navigate('Assistant')}
          >
            New Post
          </Button>
          <Button 
            mode="contained" 
            icon="chart-line" 
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
            onPress={() => navigation.navigate('Insights')}
          >
            Analyze
          </Button>
          <Button 
            mode="contained" 
            icon="lightbulb-on" 
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
            onPress={() => navigation.navigate('Assistant')}
          >
            AI Ideas
          </Button>
          <Button 
            mode="contained" 
            icon="calendar" 
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
            onPress={() => navigation.navigate('Analyzer')}
          >
            Schedule
          </Button>
        </View>
      </View>
    </ScrollView>
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
    padding: 20,
    backgroundColor: '#000000',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 15,
    color: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    backgroundColor: '#1a1a1a',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  changeChip: {
    backgroundColor: '#2a2a2a',
    height: 24,
  },
  metricLabel: {
    fontSize: 12,
    color: '#808080',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  metricBreakdown: {
    fontSize: 11,
    color: '#00D9C0',
    marginTop: 5,
    lineHeight: 16,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 20,
    backgroundColor: '#1a1a1a',
  },
  insightCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
  },
  insightContent: {
    padding: 5,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightChip: {
    marginLeft: 10,
    backgroundColor: '#2a2a2a',
  },
  insightText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 46,
    lineHeight: 20,
  },
  chartCard: {
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: '#1a1a1a',
  },
  postCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
  },
  postTitle: {
    fontSize: 16,
    marginBottom: 10,
    color: '#FFFFFF',
  },
  postStats: {
    flexDirection: 'row',
    gap: 10,
  },
  postChip: {
    backgroundColor: '#2a2a2a',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: '#00D9C0',
  },
  actionButtonContent: {
    height: 50,
  },
});

export default DashboardScreen;
