import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Card, Title, Paragraph, Button, Avatar, List, Switch, Divider, Surface, Chip } from 'react-native-paper';

import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../services/authService';
import { getConnectedAccounts, fetchUserAnalytics } from '../services/socialMediaService';
import { syncFacebookData } from '../services/facebookService';
import { syncInstagramData } from '../services/instagramService';
import { syncYouTubeData } from '../services/youtubeService';

const ProfileScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [autoPost, setAutoPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);
  const [insights, setInsights] = useState([]);
  const [userStats, setUserStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    engagement: 0,
    growth: 0
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Fetch connected accounts
      const accountsResult = await getConnectedAccounts(user.uid);
      if (accountsResult.success) {
        const platforms = accountsResult.accounts.map(acc => ({
          name: getPlatformName(acc.platform),
          connected: true,
          username: acc.username || 'Connected',
          color: getPlatformColor(acc.platform),
          platform: acc.platform
        }));
        setConnectedPlatforms(platforms);
      }

      // Fetch analytics for stats
      const analyticsResult = await fetchUserAnalytics(user.uid);
      if (analyticsResult.success && analyticsResult.analytics) {
        calculateStats(analyticsResult.analytics);
        generateInsights(analyticsResult.analytics);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (analytics) => {
    const insightsList = [];
    let totalPlatformEngagement = 0;
    let totalPlatformImpressions = 0;
    let bestPlatform = null;
    let bestEngagementRate = 0;

    analytics.forEach(platformData => {
      const platform = platformData.platform;
      const platformName = getPlatformName(platform);
      
      totalPlatformEngagement += platformData.engagement || 0;
      totalPlatformImpressions += platformData.impressions || 0;

      // Track best performing platform
      if (platformData.impressions > 0) {
        const engagementRate = (platformData.engagement / platformData.impressions) * 100;
        if (engagementRate > bestEngagementRate) {
          bestEngagementRate = engagementRate;
          bestPlatform = platformName;
        }
      }
      
      // Insight 1: Engagement rate analysis
      if (platformData.impressions > 0) {
        const engagementRate = ((platformData.engagement / platformData.impressions) * 100).toFixed(1);
        if (parseFloat(engagementRate) > 5) {
          insightsList.push({
            icon: 'trending-up',
            color: '#4caf50',
            text: `🚀 Your ${platformName} engagement rate is ${engagementRate}% - Outstanding! Your audience loves your content.`,
            priority: 1
          });
        } else if (parseFloat(engagementRate) > 2) {
          insightsList.push({
            icon: 'chart-line',
            color: '#ff9800',
            text: `📊 ${platformName} engagement: ${engagementRate}%. Try polls, questions, or behind-the-scenes content to boost interaction.`,
            priority: 2
          });
        } else {
          insightsList.push({
            icon: 'lightbulb-on',
            color: '#2196f3',
            text: `💡 ${platformName} engagement: ${engagementRate}%. Focus on storytelling and add strong calls-to-action to increase engagement.`,
            priority: 3
          });
        }
      }

      // Insight 2: Top performing content
      if (platformData.topPosts && platformData.topPosts.length > 0) {
        const bestPost = platformData.topPosts[0];
        const bestEngagement = bestPost.engagement || (bestPost.likes + bestPost.comments) || bestPost.reactions + bestPost.comments;
        const caption = bestPost.caption || 'Your post';
        insightsList.push({
          icon: 'star',
          color: '#FFD700',
          text: `⭐ Best ${platformName} post: "${caption.substring(0, 60)}${caption.length > 60 ? '...' : ''}" with ${bestEngagement} engagements!`,
          priority: 1
        });

        // Analyze what made it successful
        if (bestPost.likes > bestPost.comments * 5) {
          insightsList.push({
            icon: 'heart',
            color: '#e91e63',
            text: `❤️ Your ${platformName} content gets lots of likes! Encourage more comments by asking questions.`,
            priority: 2
          });
        }
      }

      // Insight 3: Posting frequency and consistency
      if (platformData.posts > 0) {
        if (platformData.posts < 5) {
          insightsList.push({
            icon: 'calendar-plus',
            color: '#ff5722',
            text: `📅 You have ${platformData.posts} posts on ${platformName}. Post 3-5 times per week for optimal reach and engagement.`,
            priority: 3
          });
        } else if (platformData.posts >= 10) {
          insightsList.push({
            icon: 'check-all',
            color: '#4caf50',
            text: `✅ Excellent! ${platformData.posts} posts on ${platformName}. Your consistency is building audience trust.`,
            priority: 1
          });
        } else {
          insightsList.push({
            icon: 'calendar-check',
            color: '#03a9f4',
            text: `📆 Good progress with ${platformData.posts} ${platformName} posts. Keep the momentum going!`,
            priority: 2
          });
        }
      }

      // Insight 4: Audience growth
      if (platformData.followers > 0) {
        if (platformData.followers < 1000) {
          insightsList.push({
            icon: 'account-plus',
            color: '#9c27b0',
            text: `👥 Growing your ${platformName} community (${platformData.followers} followers). Share valuable content and engage with similar accounts.`,
            priority: 3
          });
        } else if (platformData.followers < 10000) {
          insightsList.push({
            icon: 'account-group',
            color: '#673ab7',
            text: `🎯 ${platformData.followers.toLocaleString()} ${platformName} followers! You're building a strong community. Stay consistent.`,
            priority: 2
          });
        } else {
          insightsList.push({
            icon: 'trophy',
            color: '#FFD700',
            text: `🏆 Amazing! ${platformData.followers.toLocaleString()} ${platformName} followers. You're an influencer! Keep creating great content.`,
            priority: 1
          });
        }
      }

      // Insight 5: Platform-specific recommendations
      if (platform === 'facebook') {
        insightsList.push({
          icon: 'facebook',
          color: '#4267B2',
          text: `📱 Facebook tip: Post during 1-3 PM for maximum reach. Use videos and live streams to boost engagement.`,
          priority: 3
        });
      } else if (platform === 'instagram') {
        insightsList.push({
          icon: 'instagram',
          color: '#E1306C',
          text: `📸 Instagram tip: Use 8-12 relevant hashtags, post Reels for viral reach, and engage within the first hour.`,
          priority: 3
        });
      } else if (platform === 'twitter') {
        insightsList.push({
          icon: 'twitter',
          color: '#1DA1F2',
          text: `🐦 Twitter tip: Post 3-5 times daily, use trending hashtags, and create threads for better engagement.`,
          priority: 3
        });
      } else if (platform === 'linkedin') {
        insightsList.push({
          icon: 'linkedin',
          color: '#0077B5',
          text: `💼 LinkedIn tip: Share industry insights, post on weekday mornings, and engage with comments professionally.`,
          priority: 3
        });
      }
    });

    // Cross-platform insights
    if (analytics.length > 1) {
      if (bestPlatform) {
        insightsList.push({
          icon: 'medal',
          color: '#FF6F00',
          text: `🥇 ${bestPlatform} is your top performing platform with ${bestEngagementRate.toFixed(1)}% engagement. Double down on this platform!`,
          priority: 1
        });
      }

      const avgEngagementRate = totalPlatformImpressions > 0 
        ? ((totalPlatformEngagement / totalPlatformImpressions) * 100).toFixed(1)
        : 0;
      
      insightsList.push({
        icon: 'chart-arc',
        color: '#00BCD4',
        text: `📈 Overall engagement rate: ${avgEngagementRate}%. Cross-post your best content to all platforms for maximum reach.`,
        priority: 2
      });
    }

    // Sort by priority (1 = highest) and limit to top 6 insights
    const sortedInsights = insightsList
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 6);
    
    setInsights(sortedInsights);
  };

  const handleSyncFacebook = async () => {
    try {
      setSyncing(true);
      Alert.alert('Syncing', 'Fetching your Facebook data...');
      
      const result = await syncFacebookData(user.uid);
      
      if (result.success) {
        Alert.alert(
          'Success!', 
          `Facebook data synced successfully!\n\nPage: ${result.pageName}\nPosts: ${result.syncedPosts}\nFollowers: ${result.followers}\nEngagement: ${result.totalEngagements}`
        );
        // Reload user data to show updated stats
        await loadUserData();
      } else {
        Alert.alert('Info', result.message || 'Could not sync Facebook data');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to sync Facebook data');
      console.error('Facebook sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncInstagram = async () => {
    try {
      setSyncing(true);
      Alert.alert('Syncing', 'Fetching your Instagram data...');
      
      const result = await syncInstagramData(user.uid);
      
      if (result.success) {
        Alert.alert(
          'Success!', 
          `Instagram data synced successfully!\n\nPosts: ${result.syncedPosts}\nImpressions: ${result.totalImpressions}\nEngagement: ${result.totalEngagements}`
        );
        // Reload user data to show updated stats
        await loadUserData();
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to sync Instagram data');
      console.error('Instagram sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncYouTube = async () => {
    // Use Alert with a simpler approach for Android compatibility
    Alert.alert(
      'YouTube Channel ID',
      'Your Channel ID: UCMhKOM7hhkb4icpRY2XaKOg\n\nProceed with sync?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Sync Now',
          onPress: async () => {
            const channelId = 'UCMhKOM7hhkb4icpRY2XaKOg'; // Your YouTube channel ID

            try {
              setSyncing(true);
              Alert.alert('Syncing', 'Fetching your YouTube data...');
              
              const result = await syncYouTubeData(user.uid, channelId);
              
              if (result.success) {
                Alert.alert(
                  'Success!', 
                  `YouTube data synced successfully!\n\nChannel: ${result.channelName}\nVideos: ${result.syncedVideos}\nSubscribers: ${result.subscribers}\nTotal Views: ${result.totalViews}`
                );
                // Reload user data to show updated stats
                await loadUserData();
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to sync YouTube data');
              console.error('YouTube sync error:', error);
            } finally {
              setSyncing(false);
            }
          }
        }
      ]
    );
  };

  const getPlatformName = (platform) => {
    const names = {
      instagram: 'Instagram',
      twitter: 'Twitter',
      facebook: 'Facebook',
      linkedin: 'LinkedIn',
      youtube: 'YouTube'
    };
    return names[platform] || platform;
  };

  const getPlatformColor = (platform) => {
    const colors = {
      instagram: '#E1306C',
      twitter: '#1DA1F2',
      facebook: '#4267B2',
      linkedin: '#0077B5',
      youtube: '#FF0000'
    };
    return colors[platform] || '#667eea';
  };

  const calculateStats = (analytics) => {
    let totalPosts = 0;
    let totalViews = 0;
    let totalEngagement = 0;
    let totalFollowers = 0;

    // Process each platform's analytics
    analytics.forEach(platformData => {
      totalPosts += platformData.posts || 0;
      totalViews += platformData.impressions || 0;
      totalEngagement += platformData.engagement || 0;
      totalFollowers += platformData.followers || 0;
    });

    // Calculate average engagement rate
    const avgEngagementRate = totalViews > 0 
      ? ((totalEngagement / totalViews) * 100).toFixed(1)
      : '0';

    setUserStats({
      totalPosts,
      totalViews: totalViews > 1000000 ? `${(totalViews / 1000000).toFixed(1)}M` : 
                  totalViews > 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews.toString(),
      engagement: `${avgEngagementRate}%`,
      growth: totalFollowers > 1000 ? `${(totalFollowers / 1000).toFixed(1)}K` : totalFollowers.toString()
    });
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const result = await logoutUser();
            if (!result.success) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
            // Navigation will be handled automatically by AuthContext
          },
        },
      ]
    );
  };

  const handleNotificationsToggle = (value) => {
    setNotifications(value);
    Alert.alert(
      value ? 'Notifications Enabled' : 'Notifications Disabled',
      value 
        ? 'You will receive post reminders and insights'
        : 'You won\'t receive any notifications'
    );
  };

  const handleAutoPostToggle = (value) => {
    setAutoPost(value);
    Alert.alert(
      value ? 'Auto-Post Enabled' : 'Auto-Post Disabled',
      value 
        ? 'Scheduled posts will be published automatically'
        : 'You need to manually publish scheduled posts'
    );
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      `Name: ${user?.displayName || 'Not set'}\nEmail: ${user?.email}\n\nThis feature allows you to update your profile information.`,
      [{ text: 'OK' }]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password reset link will be sent to your email address.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: () => {
            Alert.alert('Success', `Password reset link sent to ${user?.email}`);
          }
        }
      ]
    );
  };

  const handleSubscription = () => {
    Alert.alert(
      'Premium Subscription',
      'You are currently on the Premium plan.\n\nFeatures:\n• Unlimited social accounts\n• AI-powered insights\n• Advanced analytics\n• Priority support\n\nPrice: $9.99/month',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Manage Subscription' }
      ]
    );
  };

  const handlePrivacySecurity = () => {
    Alert.alert(
      'Privacy & Security',
      'Your data is encrypted and secure.\n\n• Data is stored securely in Firebase\n• We never share your information\n• You can delete your account anytime\n• All connections are SSL encrypted',
      [{ text: 'OK' }]
    );
  };

  const handleHelpCenter = () => {
    Alert.alert(
      'Help Center',
      'Need help?\n\n• How to connect social accounts\n• Understanding analytics\n• Scheduling posts\n• AI content generation\n• Best practices for growth\n\nVisit our documentation for detailed guides.',
      [{ text: 'OK' }]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Email: support@growifyai.com\nResponse time: Within 24 hours\n\nPlease include:\n• Your account email\n• Issue description\n• Screenshots (if applicable)',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Email' }
      ]
    );
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate Growify AI',
      'Enjoying the app? Please rate us on the store!\n\nYour feedback helps us improve and reach more creators.',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Rate Now', onPress: () => Alert.alert('Thanks!', 'Opening app store...') }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Growify AI',
      'Version: 1.0.0\nBuild: 2025.10.24\n\nGrowify AI - Your Social Media Growth Assistant\n\nDeveloped with ❤️ for content creators\n\n© 2025 Growify AI. All rights reserved.',
      [{ text: 'OK' }]
    );
  };

  const stats = [
    { label: 'Total Posts', value: userStats.totalPosts.toString(), icon: 'post' },
    { label: 'Total Views', value: userStats.totalViews.toString(), icon: 'eye' },
    { label: 'Engagement', value: userStats.engagement, icon: 'heart' },
    { label: 'Growth', value: userStats.growth, icon: 'trending-up' },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Avatar.Text 
            size={80} 
            label={user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'U'}
            style={styles.avatar}
          />
          <Title style={styles.name}>{user?.displayName || 'User'}</Title>
          <Paragraph style={styles.email}>{user?.email || 'No email'}</Paragraph>
          <Chip icon="crown" style={styles.premiumBadge} textStyle={{ color: '#000000' }}>
            Premium Member
          </Chip>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <Surface key={index} style={styles.statCard} elevation={2}>
              <Avatar.Icon 
                size={36} 
                icon={stat.icon} 
                style={styles.statIcon}
              />
              <Paragraph style={styles.statValue}>{stat.value}</Paragraph>
              <Paragraph style={styles.statLabel}>{stat.label}</Paragraph>
            </Surface>
          ))}
        </View>

        {/* Connected Platforms */}
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Connected Platforms</Title>
          <Button 
            mode="contained"
            icon="link-variant"
            onPress={() => navigation.navigate('ConnectAccounts')}
            style={styles.manageButton}
          >
            Manage
          </Button>
        </View>

        {/* Sync Data Buttons */}
        <View style={styles.syncButtonsContainer}>
          <Button
            mode="contained"
            icon="facebook"
            onPress={handleSyncFacebook}
            loading={syncing}
            disabled={syncing}
            style={[styles.syncButton, { backgroundColor: '#4267B2' }]}
            labelStyle={{ color: '#fff' }}
          >
            Sync Facebook
          </Button>
          <Button
            mode="contained"
            icon="instagram"
            onPress={handleSyncInstagram}
            loading={syncing}
            disabled={syncing}
            style={[styles.syncButton, { backgroundColor: '#E1306C' }]}
            labelStyle={{ color: '#fff' }}
          >
            Sync Instagram
          </Button>
          <Button
            mode="contained"
            icon="youtube"
            onPress={handleSyncYouTube}
            loading={syncing}
            disabled={syncing}
            style={[styles.syncButton, { backgroundColor: '#FF0000' }]}
            labelStyle={{ color: '#fff' }}
          >
            Sync YouTube
          </Button>
        </View>

        {/* AI-Powered Insights */}
        {insights.length > 0 && (
          <>
            <Title style={styles.sectionTitle}>💡 AI Insights</Title>
            <Card style={styles.insightsCard} mode="elevated">
              <Card.Content>
                {insights.map((insight, index) => (
                  <View key={index} style={styles.insightItem}>
                    <Avatar.Icon 
                      size={40} 
                      icon={insight.icon} 
                      style={[styles.insightIcon, { backgroundColor: insight.color }]}
                    />
                    <Paragraph style={styles.insightText}>{insight.text}</Paragraph>
                  </View>
                ))}
              </Card.Content>
            </Card>
          </>
        )}

        {connectedPlatforms.length > 0 ? (
          connectedPlatforms.map((platform, index) => (
            <Card key={index} style={styles.platformCard} mode="elevated">
              <Card.Content style={styles.platformContent}>
                <View style={styles.platformInfo}>
                  <Avatar.Icon 
                    size={48} 
                    icon={getPlatformName(platform.platform).toLowerCase()} 
                    style={[styles.platformIcon, { backgroundColor: getPlatformColor(platform.platform) }]}
                  />
                  <View style={styles.platformDetails}>
                    <Title style={styles.platformName}>{getPlatformName(platform.platform)}</Title>
                    <Paragraph style={styles.platformFollowers}>
                      @{platform.username}
                    </Paragraph>
                  </View>
                </View>
                <Chip 
                  icon="check-circle" 
                  style={styles.connectedChip}
                  textStyle={{ color: '#fff', fontSize: 11 }}
                >
                  Connected
                </Chip>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={styles.platformCard} mode="elevated">
            <Card.Content>
              <Paragraph style={{ textAlign: 'center', color: '#666', marginBottom: 15 }}>
                No platforms connected yet. Connect your social media accounts to unlock powerful analytics and AI features!
              </Paragraph>
              <Button 
                mode="contained" 
                icon="link-plus"
                onPress={() => navigation.navigate('ConnectAccounts')}
                style={{ backgroundColor: '#667eea' }}
              >
                Connect Accounts
              </Button>
            </Card.Content>
          </Card>
        )}

        <Divider style={styles.divider} />

        {/* Settings */}
        <Title style={styles.sectionTitle}>Settings</Title>
        <Card style={styles.settingsCard}>
          <List.Item
            title="Push Notifications"
            description="Receive post reminders and insights"
            left={props => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch 
                value={notifications} 
                onValueChange={handleNotificationsToggle}
                color="#00D9C0"
              />
            )}
          />
          <Divider />
          <List.Item
            title="Auto-Post"
            description="Automatically publish scheduled posts"
            left={props => <List.Icon {...props} icon="robot" />}
            right={() => (
              <Switch 
                value={autoPost} 
                onValueChange={handleAutoPostToggle}
                color="#00D9C0"
              />
            )}
          />
        </Card>

        <Divider style={styles.divider} />

        {/* Account */}
        <Title style={styles.sectionTitle}>Account</Title>
        <Card style={styles.accountCard}>
          <List.Item
            title="Edit Profile"
            description="Update your personal information"
            left={props => <List.Icon {...props} icon="account-edit" color="#00D9C0" />}
            right={props => <List.Icon {...props} icon="chevron-right" color="#808080" />}
            onPress={handleEditProfile}
          />
          <Divider />
          <List.Item
            title="Change Password"
            description="Update your password"
            left={props => <List.Icon {...props} icon="lock-reset" color="#00D9C0" />}
            right={props => <List.Icon {...props} icon="chevron-right" color="#808080" />}
            onPress={handleChangePassword}
          />
          <Divider />
          <List.Item
            title="Subscription"
            description="Manage your premium subscription"
            left={props => <List.Icon {...props} icon="credit-card" color="#00D9C0" />}
            right={props => <List.Icon {...props} icon="chevron-right" color="#808080" />}
            onPress={handleSubscription}
          />
          <Divider />
          <List.Item
            title="Privacy & Security"
            description="Control your data and privacy"
            left={props => <List.Icon {...props} icon="shield-account" color="#00D9C0" />}
            right={props => <List.Icon {...props} icon="chevron-right" color="#808080" />}
            onPress={handlePrivacySecurity}
          />
        </Card>

        <Divider style={styles.divider} />

        {/* Support */}
        <Title style={styles.sectionTitle}>Support</Title>
        <Card style={styles.supportCard}>
          <List.Item
            title="Help Center"
            description="Get help and tutorials"
            left={props => <List.Icon {...props} icon="help-circle" color="#00D9C0" />}
            right={props => <List.Icon {...props} icon="chevron-right" color="#808080" />}
            onPress={handleHelpCenter}
          />
          <Divider />
          <List.Item
            title="Contact Support"
            description="Reach out to our team"
            left={props => <List.Icon {...props} icon="email" color="#00D9C0" />}
            right={props => <List.Icon {...props} icon="chevron-right" color="#808080" />}
            onPress={handleContactSupport}
          />
          <Divider />
          <List.Item
            title="Rate App"
            description="Share your feedback"
            left={props => <List.Icon {...props} icon="star" color="#00D9C0" />}
            right={props => <List.Icon {...props} icon="chevron-right" color="#808080" />}
            onPress={handleRateApp}
          />
          <Divider />
          <List.Item
            title="About"
            description="App version and info"
            left={props => <List.Icon {...props} icon="information" color="#00D9C0" />}
            right={props => <List.Icon {...props} icon="chevron-right" color="#808080" />}
            onPress={handleAbout}
          />
        </Card>

        {/* Logout Button */}
        <Button 
          mode="contained" 
          icon="logout" 
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
          onPress={handleLogout}
        >
          Logout
        </Button>
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
    paddingBottom: 30,
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  profileInfo: {
    alignItems: 'center',
  },
  avatar: {
    marginBottom: 15,
    backgroundColor: '#00D9C0',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    color: '#808080',
    fontSize: 14,
    marginBottom: 10,
  },
  premiumBadge: {
    backgroundColor: '#00D9C0',
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000000',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  statIcon: {
    backgroundColor: '#00D9C0',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#808080',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 15,
    color: '#FFFFFF',
  },
  platformCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
  },
  platformContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  platformIcon: {
    marginRight: 12,
  },
  platformDetails: {
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    marginBottom: 2,
    color: '#FFFFFF',
  },
  platformFollowers: {
    fontSize: 12,
    color: '#808080',
  },
  connectedChip: {
    backgroundColor: '#00D9C0',
  },
  connectButton: {
    borderColor: '#00D9C0',
  },
  syncButtonsContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  syncButton: {
    borderRadius: 12,
    paddingVertical: 4,
    backgroundColor: '#00D9C0',
  },
  insightsCard: {
    marginBottom: 15,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  insightIcon: {
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  divider: {
    marginVertical: 20,
    backgroundColor: '#1a1a1a',
  },
  settingsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  accountCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  supportCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  logoutButton: {
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: '#00D9C0',
    borderRadius: 10,
  },
  logoutButtonContent: {
    height: 50,
  },
});

export default ProfileScreen;
