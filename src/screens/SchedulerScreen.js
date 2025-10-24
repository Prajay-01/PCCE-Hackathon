import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Modal, TextInput, Platform, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, FAB, Avatar, Surface, Portal, Dialog, RadioButton, Text } from 'react-native-paper';

import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../context/AuthContext';

const SchedulerScreen = () => {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState('today');
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  
  // New post form state
  const [newPost, setNewPost] = useState({
    title: '',
    caption: '',
    platform: 'instagram',
    scheduledDateTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
  });

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Real-time listener for scheduled posts
    const unsubscribe = firestore()
      .collection('scheduledPosts')
      .where('userId', '==', user.uid)
      .onSnapshot(
        (snapshot) => {
          const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            scheduledDateTime: doc.data().scheduledDateTime?.toDate(),
          })).sort((a, b) => {
            // Sort manually by scheduledDateTime
            if (!a.scheduledDateTime) return 1;
            if (!b.scheduledDateTime) return -1;
            return a.scheduledDateTime - b.scheduledDateTime;
          });

          setScheduledPosts(posts);
          setLoading(false);
        },
        (error) => {
          console.error('Error loading scheduled posts:', error);
          Alert.alert('Error', 'Failed to load scheduled posts: ' + error.message);
          setLoading(false);
        }
      );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [user]);

  const handleSchedulePost = async () => {
    if (!newPost.title.trim()) {
      Alert.alert('Error', 'Please enter a post title');
      return;
    }

    try {
      const postData = {
        userId: user.uid,
        title: newPost.title.trim(),
        caption: newPost.caption.trim(),
        platform: newPost.platform,
        scheduledDateTime: firestore.Timestamp.fromDate(newPost.scheduledDateTime),
        status: 'scheduled',
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore().collection('scheduledPosts').add(postData);

      Alert.alert('Success!', 'Post scheduled successfully');
      setShowScheduleDialog(false);
      setNewPost({
        title: '',
        caption: '',
        platform: 'instagram',
        scheduledDateTime: new Date(Date.now() + 60 * 60 * 1000),
      });
      // Real-time listener will automatically update the list
    } catch (error) {
      console.error('Error scheduling post:', error);
      Alert.alert('Error', 'Failed to schedule post');
    }
  };
  
  const adjustDateTime = (hours) => {
    const newDateTime = new Date(newPost.scheduledDateTime);
    newDateTime.setHours(newDateTime.getHours() + hours);
    setNewPost({ ...newPost, scheduledDateTime: newDateTime });
  };

  const handleDeletePost = (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this scheduled post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore().collection('scheduledPosts').doc(postId).delete();
              Alert.alert('Success', 'Post deleted successfully');
              // Real-time listener will automatically update the list
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getRelativeDate = (date) => {
    if (!date) return '';
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredPosts = scheduledPosts.filter(post => {
    const postDate = post.scheduledDateTime;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    if (selectedDay === 'today') {
      return postDate?.toDateString() === today.toDateString();
    } else if (selectedDay === 'tomorrow') {
      return postDate?.toDateString() === tomorrow.toDateString();
    } else {
      return postDate && postDate <= weekEnd;
    }
  });

  // Calculate real stats from scheduledPosts
  const scheduledCount = scheduledPosts.filter(p => p.status === 'scheduled').length;
  const publishedCount = scheduledPosts.filter(p => p.status === 'published').length;
  const pendingCount = scheduledPosts.filter(p => p.status === 'pending').length;

  const optimalTimes = [
    { time: '2:00 PM - 4:00 PM', day: 'Weekdays', engagement: '95%', icon: 'fire' },
    { time: '7:00 PM - 9:00 PM', day: 'Weekdays', engagement: '88%', icon: 'trending-up' },
    { time: '10:00 AM - 12:00 PM', day: 'Weekends', engagement: '92%', icon: 'star' },
  ];

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'Instagram': return '#E1306C';
      case 'YouTube': return '#FF0000';
      case 'Twitter': return '#1DA1F2';
      case 'LinkedIn': return '#0077B5';
      default: return '#667eea';
    }
  };

  const getEngagementColor = (engagement) => {
    switch (engagement) {
      case 'high': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'low': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Growify AI</Title>
        <Paragraph style={styles.headerSubtitle}>@</Paragraph>
      </View>

      <ScrollView style={styles.content}>
        {/* Calendar Week View */}
        <Card style={styles.calendarCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>This Week</Title>
            <View style={styles.weekView}>
              {weekDays.map((day, index) => (
                <Surface 
                  key={index} 
                  style={[
                    styles.dayCard,
                    selectedDay === day.toLowerCase() && styles.selectedDay
                  ]}
                  elevation={2}
                >
                  <Paragraph style={styles.dayLabel}>{day}</Paragraph>
                  <Paragraph style={styles.dayNumber}>{15 + index}</Paragraph>
                  <View style={styles.dayDot} />
                </Surface>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* AI-Recommended Optimal Times */}
        <Title style={styles.sectionTitle}>🤖 Optimal Posting Times</Title>
        {optimalTimes.map((time, index) => (
          <Card key={index} style={styles.timeCard} mode="elevated">
            <Card.Content style={styles.timeContent}>
              <Avatar.Icon 
                size={48} 
                icon={time.icon} 
                style={styles.timeIcon} 
              />
              <View style={styles.timeDetails}>
                <Title style={styles.timeTitle}>{time.time}</Title>
                <Paragraph style={styles.timeDay}>{time.day}</Paragraph>
              </View>
              <Chip 
                style={styles.engagementChip}
                textStyle={{ color: '#000000', fontWeight: 'bold' }}
              >
                {time.engagement}
              </Chip>
            </Card.Content>
          </Card>
        ))}

        {/* Scheduled Posts */}
        <Title style={styles.sectionTitle}>Scheduled Posts</Title>
        <View style={styles.filterButtons}>
          <Chip 
            selected={selectedDay === 'today'} 
            onPress={() => setSelectedDay('today')}
            style={styles.filterChip}
            selectedColor="#00D9C0"
            textStyle={{ color: selectedDay === 'today' ? '#FFFFFF' : '#808080' }}
          >
            Today
          </Chip>
          <Chip 
            selected={selectedDay === 'tomorrow'} 
            onPress={() => setSelectedDay('tomorrow')}
            style={styles.filterChip}
            selectedColor="#00D9C0"
            textStyle={{ color: selectedDay === 'tomorrow' ? '#FFFFFF' : '#808080' }}
          >
            Tomorrow
          </Chip>
          <Chip 
            selected={selectedDay === 'week'} 
            onPress={() => setSelectedDay('week')}
            style={styles.filterChip}
            selectedColor="#00D9C0"
            textStyle={{ color: selectedDay === 'week' ? '#FFFFFF' : '#808080' }}
          >
            This Week
          </Chip>
        </View>

        {filteredPosts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Avatar.Icon size={64} icon="calendar-blank" style={styles.emptyIcon} />
              <Title style={styles.emptyTitle}>No posts scheduled</Title>
              <Paragraph style={styles.emptyText}>Tap the + button to schedule your first post</Paragraph>
            </Card.Content>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id} style={styles.postCard} mode="elevated">
              <Card.Content>
                <View style={styles.postHeader}>
                  <View style={styles.postTime}>
                    <Avatar.Icon 
                      size={36} 
                      icon="clock-outline" 
                      style={styles.clockIcon}
                    />
                    <View style={styles.postTimeText}>
                      <Paragraph style={styles.scheduledTime}>
                        {post.scheduledDateTime?.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </Paragraph>
                      <Paragraph style={styles.scheduledDate}>
                        {getRelativeDate(post.scheduledDateTime)}
                      </Paragraph>
                    </View>
                  </View>
                  <Chip 
                    style={[styles.statusChip, { 
                      backgroundColor: post.status === 'pending' ? '#ff9800' : '#2196f3' 
                    }]}
                    textStyle={{ color: '#fff', fontSize: 10 }}
                  >
                    {post.status.toUpperCase()}
                  </Chip>
                </View>

                <Title style={styles.postTitle}>{post.title}</Title>
                {post.caption && (
                  <Paragraph style={styles.postCaption} numberOfLines={2}>
                    {post.caption}
                  </Paragraph>
                )}

                <View style={styles.postMeta}>
                  <Chip 
                    style={[styles.platformChip, { backgroundColor: getPlatformColor(post.platform) }]}
                    textStyle={{ color: '#fff', fontSize: 11 }}
                    icon="share"
                  >
                    {post.platform}
                  </Chip>
                </View>

                <View style={styles.postActions}>
                  <Button 
                    mode="outlined" 
                    icon="delete" 
                    style={styles.actionButton}
                    textColor="#f44336"
                    onPress={() => handleDeletePost(post.id)}
                  >
                    Delete
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}

        {/* Quick Stats */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>This Week's Stats</Title>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Avatar.Icon size={40} icon="calendar-check" style={styles.statIcon} />
                <Paragraph style={styles.statValue}>{scheduledCount}</Paragraph>
                <Paragraph style={styles.statLabel}>Scheduled</Paragraph>
              </View>
              <View style={styles.statItem}>
                <Avatar.Icon size={40} icon="check-circle" style={styles.statIconSuccess} />
                <Paragraph style={styles.statValue}>{publishedCount}</Paragraph>
                <Paragraph style={styles.statLabel}>Published</Paragraph>
              </View>
              <View style={styles.statItem}>
                <Avatar.Icon size={40} icon="clock-alert" style={styles.statIconWarning} />
                <Paragraph style={styles.statValue}>{pendingCount}</Paragraph>
                <Paragraph style={styles.statLabel}>Pending</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowScheduleDialog(true)}
        label="Schedule Post"
        color="#000000"
      />

      {/* Schedule Post Dialog */}
      <Portal>
        <Dialog 
          visible={showScheduleDialog} 
          onDismiss={() => setShowScheduleDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Schedule New Post</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogContent}>
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Post Title *"
                placeholderTextColor="#808080"
                value={newPost.title}
                onChangeText={(text) => setNewPost({ ...newPost, title: text })}
                textColor="#FFFFFF"
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Caption (optional)"
                placeholderTextColor="#808080"
                value={newPost.caption}
                onChangeText={(text) => setNewPost({ ...newPost, caption: text })}
                multiline
                numberOfLines={3}
                textColor="#FFFFFF"
              />

              <Title style={styles.dialogSectionTitle}>Select Platform</Title>
              <RadioButton.Group 
                onValueChange={value => setNewPost({ ...newPost, platform: value })} 
                value={newPost.platform}
              >
                <View style={styles.radioOption}>
                  <RadioButton value="instagram" color="#00D9C0" />
                  <Paragraph style={styles.radioLabel}>Instagram</Paragraph>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="facebook" color="#00D9C0" />
                  <Paragraph style={styles.radioLabel}>Facebook</Paragraph>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="twitter" color="#00D9C0" />
                  <Paragraph style={styles.radioLabel}>Twitter/X</Paragraph>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="linkedin" color="#00D9C0" />
                  <Paragraph style={styles.radioLabel}>LinkedIn</Paragraph>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="youtube" color="#00D9C0" />
                  <Paragraph style={styles.radioLabel}>YouTube</Paragraph>
                </View>
              </RadioButton.Group>

              <Title style={styles.dialogSectionTitle}>Schedule Date & Time</Title>
              <Card style={styles.dateTimeCard}>
                <Card.Content>
                  <Text style={styles.dateTimeDisplay}>
                    📅 {newPost.scheduledDateTime.toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </Text>
                  <Text style={styles.dateTimeLabel}>Adjust time:</Text>
                  <View style={styles.dateTimeButtons}>
                    <Button 
                      mode="contained" 
                      icon="minus" 
                      onPress={() => adjustDateTime(-1)}
                      style={styles.dateButton}
                      buttonColor="#00D9C0"
                      textColor="#000000"
                      compact
                    >
                      -1h
                    </Button>
                    <Button 
                      mode="contained" 
                      icon="plus" 
                      onPress={() => adjustDateTime(1)}
                      style={styles.dateButton}
                      buttonColor="#00D9C0"
                      textColor="#000000"
                      compact
                    >
                      +1h
                    </Button>
                    <Button 
                      mode="contained" 
                      icon="calendar-today" 
                      onPress={() => adjustDateTime(24)}
                      style={styles.dateButton}
                      buttonColor="#00D9C0"
                      textColor="#000000"
                      compact
                    >
                      +1d
                    </Button>
                  </View>
                </Card.Content>
              </Card>


            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions style={styles.dialogActions}>
            <Button 
              onPress={() => setShowScheduleDialog(false)}
              textColor="#808080"
            >
              Cancel
            </Button>
            <Button 
              onPress={handleSchedulePost}
              buttonColor="#00D9C0"
              textColor="#000000"
              mode="contained"
            >
              Schedule
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  calendarCard: {
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#FFFFFF',
  },
  weekView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCard: {
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    width: 45,
  },
  selectedDay: {
    backgroundColor: '#00D9C0',
  },
  dayLabel: {
    fontSize: 11,
    color: '#808080',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#FFFFFF',
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D9C0',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 15,
    color: '#FFFFFF',
  },
  timeCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
  },
  timeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    backgroundColor: '#00D9C0',
  },
  timeDetails: {
    flex: 1,
    marginLeft: 12,
  },
  timeTitle: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  timeDay: {
    fontSize: 12,
    color: '#808080',
  },
  engagementChip: {
    backgroundColor: '#00D9C0',
  },
  filterButtons: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#1a1a1a',
  },
  postCard: {
    marginBottom: 15,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  postTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIcon: {
    backgroundColor: '#00D9C0',
  },
  postTimeText: {
    marginLeft: 10,
  },
  scheduledTime: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  scheduledDate: {
    fontSize: 11,
    color: '#808080',
  },
  statusChip: {
    height: 24,
    backgroundColor: '#2a2a2a',
  },
  postTitle: {
    fontSize: 16,
    marginBottom: 10,
    color: '#FFFFFF',
  },
  postMeta: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  platformChip: {
    height: 26,
    backgroundColor: '#2a2a2a',
  },
  engagementBadge: {
    height: 26,
  },
  postActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderColor: '#00D9C0',
  },
  statsCard: {
    borderRadius: 16,
    marginTop: 10,
    marginBottom: 80,
    backgroundColor: '#1a1a1a',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    backgroundColor: '#00D9C0',
  },
  statIconSuccess: {
    backgroundColor: '#00D9C0',
  },
  statIconWarning: {
    backgroundColor: '#00D9C0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#808080',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#00D9C0',
  },
  dialog: {
    backgroundColor: '#1a1a1a',
  },
  dialogTitle: {
    color: '#FFFFFF',
    backgroundColor: '#1a1a1a',
  },
  dialogContent: {
    maxHeight: 500,
    backgroundColor: '#1a1a1a',
  },
  dialogActions: {
    backgroundColor: '#1a1a1a',
  },
  input: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    color: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dialogSectionTitle: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 8,
    color: '#FFFFFF',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    color: '#FFFFFF',
  },
  dateTimeCard: {
    marginBottom: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
  },
  dateTimeDisplay: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#00D9C0',
    textAlign: 'center',
  },
  dateTimeLabel: {
    fontSize: 14,
    color: '#808080',
    marginBottom: 8,
  },
  dateTimeButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  dateButton: {
    flex: 1,
  },
  emptyCard: {
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
  },
  emptyContent: {
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    backgroundColor: '#2a2a2a',
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    marginTop: 10,
  },
  emptyText: {
    color: '#808080',
    textAlign: 'center',
  },
  postCaption: {
    fontSize: 14,
    color: '#808080',
    marginBottom: 10,
  },
});

export default SchedulerScreen;
