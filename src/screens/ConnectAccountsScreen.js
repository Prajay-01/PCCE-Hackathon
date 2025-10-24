import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import { Card, Title, Paragraph, Button, List, ActivityIndicator, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getConnectedAccounts, connectSocialAccount, disconnectSocialAccount, PLATFORMS } from '../services/socialMediaService';

const ConnectAccountsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [connecting, setConnecting] = useState(null);

  const platformInfo = {
    [PLATFORMS.INSTAGRAM]: {
      name: 'Instagram',
      icon: 'instagram',
      color: '#E1306C',
      description: 'Connect to analyze posts, followers, and engagement'
    },
    [PLATFORMS.TWITTER]: {
      name: 'Twitter/X',
      icon: 'twitter',
      color: '#1DA1F2',
      description: 'Track tweets, impressions, and follower growth'
    },
    [PLATFORMS.FACEBOOK]: {
      name: 'Facebook',
      icon: 'facebook',
      color: '#4267B2',
      description: 'Monitor page performance and post reach'
    },
    [PLATFORMS.LINKEDIN]: {
      name: 'LinkedIn',
      icon: 'linkedin',
      color: '#0077B5',
      description: 'Analyze professional content and connections'
    },
    [PLATFORMS.YOUTUBE]: {
      name: 'YouTube',
      icon: 'youtube',
      color: '#FF0000',
      description: 'Track video views, subscribers, and watch time'
    }
  };

  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    setLoading(true);
    const result = await getConnectedAccounts(user.uid);
    if (result.success) {
      setConnectedAccounts(result.accounts);
    }
    setLoading(false);
  };

  const isConnected = (platform) => {
    return connectedAccounts.some(acc => acc.platform === platform);
  };

  const handleConnect = async (platform) => {
    setConnecting(platform);
    
    Alert.alert(
      `Connect ${platformInfo[platform].name}`,
      'Enter your credentials to connect',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setConnecting(null)
        },
        {
          text: 'Connect',
          onPress: async () => {
            // Simulate API connection
            const demoCredentials = {
              username: `user_${platform}`,
              accessToken: `demo_token_${Date.now()}`,
              refreshToken: `refresh_${Date.now()}`,
              expiresAt: Date.now() + 3600000
            };
            
            const result = await connectSocialAccount(user.uid, platform, demoCredentials);
            
            if (result.success) {
              Alert.alert('Success', `${platformInfo[platform].name} connected successfully!`);
              await loadConnectedAccounts();
            } else {
              Alert.alert('Error', result.error);
            }
            
            setConnecting(null);
          }
        }
      ]
    );
  };

  const handleDisconnect = async (platform) => {
    Alert.alert(
      'Disconnect Account',
      `Are you sure you want to disconnect ${platformInfo[platform].name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            const result = await disconnectSocialAccount(user.uid, platform);
            if (result.success) {
              Alert.alert('Success', 'Account disconnected');
              await loadConnectedAccounts();
            } else {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Title style={styles.headerTitle}>Connect Accounts</Title>
        <Paragraph style={styles.headerSubtitle}>
          Link your social media accounts to get real-time analytics
        </Paragraph>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title>Connected Accounts</Title>
            <Paragraph>{connectedAccounts.length} of {Object.keys(PLATFORMS).length} platforms connected</Paragraph>
          </Card.Content>
        </Card>

        {Object.entries(platformInfo).map(([key, info]) => {
          const connected = isConnected(key);
          const isLoading = connecting === key;

          return (
            <Card key={key} style={styles.platformCard}>
              <Card.Content>
                <View style={styles.platformHeader}>
                  <View style={styles.platformInfo}>
                    <List.Icon icon={info.icon} color={info.color} />
                    <View>
                      <Title style={styles.platformName}>{info.name}</Title>
                      <Paragraph style={styles.platformDescription}>
                        {info.description}
                      </Paragraph>
                    </View>
                  </View>
                  {connected && (
                    <Chip icon="check" mode="flat" style={{ backgroundColor: '#4CAF50' }}>
                      Connected
                    </Chip>
                  )}
                </View>
              </Card.Content>
              <Card.Actions>
                {connected ? (
                  <>
                    <Button
                      onPress={() => navigation.navigate('Dashboard')}
                      mode="contained"
                      style={{ backgroundColor: info.color }}
                    >
                      View Analytics
                    </Button>
                    <Button
                      onPress={() => handleDisconnect(key)}
                      mode="outlined"
                      textColor="#f44336"
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    onPress={() => handleConnect(key)}
                    mode="contained"
                    loading={isLoading}
                    disabled={isLoading}
                    style={{ backgroundColor: info.color }}
                  >
                    Connect
                  </Button>
                )}
              </Card.Actions>
            </Card>
          );
        })}

        <Card style={styles.infoCard}>
          <Card.Content>
            <Title>Why Connect?</Title>
            <List.Item
              title="Real-time Analytics"
              description="Get up-to-date metrics from your accounts"
              left={props => <List.Icon {...props} icon="chart-line" />}
            />
            <List.Item
              title="AI Insights"
              description="Receive personalized recommendations"
              left={props => <List.Icon {...props} icon="brain" />}
            />
            <List.Item
              title="Growth Tracking"
              description="Monitor your progress over time"
              left={props => <List.Icon {...props} icon="trending-up" />}
            />
            <List.Item
              title="Secure Connection"
              description="Your data is encrypted and protected"
              left={props => <List.Icon {...props} icon="shield-check" />}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  statsCard: {
    marginBottom: 20,
  },
  platformCard: {
    marginBottom: 15,
  },
  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  platformName: {
    fontSize: 18,
    marginLeft: -10,
  },
  platformDescription: {
    fontSize: 12,
    color: '#666',
    marginLeft: -10,
  },
  infoCard: {
    marginTop: 10,
    marginBottom: 30,
  },
});

export default ConnectAccountsScreen;
