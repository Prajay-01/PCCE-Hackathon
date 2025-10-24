import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput as RNTextInput, Alert } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Chip, 
  Avatar, 
  TextInput,
  SegmentedButtons,
  ActivityIndicator,
  Divider,
  Surface
} from 'react-native-paper';

import { useAuth } from '../context/AuthContext';
import {
  generatePostIdeas,
  generateCaption,
  generateHashtags,
  saveGeneratedContent,
  predictEngagement,
  getTrendingTopics,
} from '../services/contentGeneratorService';

const ContentCreatorScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [selectedNiche, setSelectedNiche] = useState('tech');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [topic, setTopic] = useState('');
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [generatedHashtags, setGeneratedHashtags] = useState([]);
  const [postIdeas, setPostIdeas] = useState([]);
  const [engagementScore, setEngagementScore] = useState(0);
  const [showIdeas, setShowIdeas] = useState(true);

  useEffect(() => {
    loadPostIdeas();
  }, [selectedPlatform, selectedNiche]);

  const loadPostIdeas = async () => {
    setLoading(true);
    const ideas = await generatePostIdeas(user.uid, selectedNiche, selectedPlatform);
    setPostIdeas(ideas);
    setLoading(false);
  };

  const handleGenerateCaption = () => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic first!');
      return;
    }

    const caption = generateCaption(topic, selectedPlatform, selectedTone);
    setGeneratedCaption(caption);

    // Generate hashtags
    const hashtags = generateHashtags(caption, selectedPlatform, selectedNiche, 10);
    setGeneratedHashtags(hashtags);

    // Predict engagement
    const score = predictEngagement(caption, hashtags, selectedPlatform, new Date());
    setEngagementScore(score);
    
    setShowIdeas(false);
  };

  const handleUseIdea = (idea) => {
    setTopic(idea.topic);
    setGeneratedCaption(idea.caption);
    const hashtags = generateHashtags(idea.caption, selectedPlatform, selectedNiche, 10);
    setGeneratedHashtags(hashtags);
    const score = predictEngagement(idea.caption, hashtags, selectedPlatform, new Date());
    setEngagementScore(score);
    setShowIdeas(false);
  };

  const handleSaveContent = async () => {
    if (!generatedCaption) {
      Alert.alert('Error', 'Generate content first!');
      return;
    }

    const content = {
      topic,
      caption: generatedCaption,
      hashtags: generatedHashtags,
      platform: selectedPlatform,
      niche: selectedNiche,
      tone: selectedTone,
      engagementScore,
    };

    const result = await saveGeneratedContent(user.uid, content);
    if (result.success) {
      Alert.alert('Success', 'Content saved to drafts!');
    } else {
      Alert.alert('Error', 'Failed to save content');
    }
  };

  const handleCopyAll = () => {
    const fullContent = `${generatedCaption}\n\n${generatedHashtags.join(' ')}`;
    Alert.alert('Copied!', 'Content copied to clipboard (simulated)');
  };

  const niches = [
    { value: 'tech', label: 'Tech' },
    { value: 'business', label: 'Business' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'education', label: 'Education' },
    { value: 'entertainment', label: 'Entertainment' },
  ];

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'inspirational', label: 'Inspirational' },
  ];

  const trendingTopics = getTrendingTopics(selectedNiche);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Growify AI</Title>
        <Paragraph style={styles.headerSubtitle}>@</Paragraph>
      </View>

      <ScrollView style={styles.content}>
        {/* Platform Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Select Platform</Title>
            <View style={styles.platformButtons}>
              {[
                { id: 'instagram', icon: 'instagram', color: '#E1306C' },
                { id: 'twitter', icon: 'twitter', color: '#1DA1F2' },
                { id: 'linkedin', icon: 'linkedin', color: '#0077B5' },
                { id: 'youtube', icon: 'youtube', color: '#FF0000' },
              ].map((platform) => (
                <TouchableOpacity
                  key={platform.id}
                  style={[
                    styles.platformButton,
                    selectedPlatform === platform.id && styles.platformButtonActive,
                    { borderColor: platform.color },
                  ]}
                  onPress={() => setSelectedPlatform(platform.id)}
                >
                  <Avatar.Icon
                    size={40}
                    icon={platform.icon}
                    style={{ backgroundColor: platform.color }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Niche & Tone Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Niche & Tone</Title>
            <Paragraph style={styles.label}>Select Your Niche</Paragraph>
            <View style={styles.chipContainer}>
              {niches.map((niche) => (
                <Chip
                  key={niche.value}
                  selected={selectedNiche === niche.value}
                  onPress={() => setSelectedNiche(niche.value)}
                  style={styles.chip}
                  selectedColor="#667eea"
                >
                  {niche.label}
                </Chip>
              ))}
            </View>

            <Paragraph style={[styles.label, { marginTop: 15 }]}>Content Tone</Paragraph>
            <View style={styles.chipContainer}>
              {tones.map((tone) => (
                <Chip
                  key={tone.value}
                  selected={selectedTone === tone.value}
                  onPress={() => setSelectedTone(tone.value)}
                  style={styles.chip}
                  selectedColor="#f093fb"
                >
                  {tone.label}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Trending Topics */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>🔥 Trending Topics</Title>
            <View style={styles.chipContainer}>
              {trendingTopics.map((trendTopic) => (
                <Chip
                  key={trendTopic}
                  icon="trending-up"
                  onPress={() => setTopic(trendTopic)}
                  style={styles.trendChip}
                >
                  {trendTopic}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {showIdeas ? (
          // Post Ideas Section
          <>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>💡 AI Post Ideas</Title>
              <Button mode="text" onPress={loadPostIdeas}>
                Refresh
              </Button>
            </View>
            {loading ? (
              <ActivityIndicator size="large" color="#667eea" style={{ marginTop: 20 }} />
            ) : (
              postIdeas.map((idea) => (
                <Card key={idea.id} style={styles.ideaCard} mode="elevated">
                  <Card.Content>
                    <View style={styles.ideaHeader}>
                      <Chip icon="lightbulb" style={styles.topicChip}>
                        {idea.topic}
                      </Chip>
                      <Chip icon="fire" style={styles.engagementChip}>
                        {idea.estimatedEngagement}% engagement
                      </Chip>
                    </View>
                    <Paragraph style={styles.ideaCaption}>{idea.caption}</Paragraph>
                    <Button
                      mode="contained"
                      onPress={() => handleUseIdea(idea)}
                      style={styles.useIdeaButton}
                    >
                      Use This Idea
                    </Button>
                  </Card.Content>
                </Card>
              ))
            )}
            <Divider style={styles.divider} />
            <Title style={styles.sectionTitle}>Or Create Custom Content</Title>
          </>
        ) : null}

        {/* Topic Input */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Enter Your Topic</Title>
            <TextInput
              mode="outlined"
              label="What do you want to post about?"
              value={topic}
              onChangeText={setTopic}
              placeholder="e.g., AI in healthcare, productivity tips..."
              style={styles.input}
              outlineColor="#667eea"
              activeOutlineColor="#667eea"
            />
            <Button
              mode="contained"
              icon="auto-fix"
              onPress={handleGenerateCaption}
              style={styles.generateButton}
              contentStyle={styles.generateButtonContent}
            >
              Generate AI Content
            </Button>
          </Card.Content>
        </Card>

        {/* Generated Content */}
        {generatedCaption ? (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.contentHeader}>
                  <Title style={styles.sectionTitle}>📝 Generated Caption</Title>
                  <Chip
                    icon="chart-line"
                    style={[
                      styles.scoreChip,
                      { backgroundColor: engagementScore > 70 ? '#43e97b' : '#f093fb' },
                    ]}
                    textStyle={{ color: '#fff' }}
                  >
                    {engagementScore}% Score
                  </Chip>
                </View>
                <Surface style={styles.captionBox} elevation={1}>
                  <Paragraph style={styles.captionText}>{generatedCaption}</Paragraph>
                </Surface>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.sectionTitle}>#️⃣ Suggested Hashtags</Title>
                <View style={styles.hashtagContainer}>
                  {generatedHashtags.map((hashtag, index) => (
                    <Chip key={index} style={styles.hashtagChip}>
                      {hashtag}
                    </Chip>
                  ))}
                </View>
              </Card.Content>
            </Card>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                icon="content-copy"
                onPress={handleCopyAll}
                style={[styles.actionButton, { backgroundColor: '#4facfe' }]}
              >
                Copy All
              </Button>
              <Button
                mode="contained"
                icon="content-save"
                onPress={handleSaveContent}
                style={[styles.actionButton, { backgroundColor: '#43e97b' }]}
              >
                Save Draft
              </Button>
            </View>

            <Button
              mode="outlined"
              icon="refresh"
              onPress={() => setShowIdeas(true)}
              style={styles.newIdeaButton}
            >
              Generate New Ideas
            </Button>
          </>
        ) : null}
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
  card: {
    marginBottom: 15,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  platformButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  platformButton: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
  },
  platformButtonActive: {
    borderWidth: 3,
    borderColor: '#00D9C0',
    backgroundColor: '#0a2a27',
  },
  label: {
    fontSize: 14,
    color: '#808080',
    marginBottom: 8,
    fontWeight: '500',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 5,
    marginBottom: 5,
    backgroundColor: '#2a2a2a',
  },
  trendChip: {
    marginRight: 5,
    marginBottom: 5,
    backgroundColor: '#2a2a2a',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#2a2a2a',
  },
  generateButton: {
    marginTop: 10,
    backgroundColor: '#00D9C0',
  },
  generateButtonContent: {
    paddingVertical: 8,
  },
  ideaCard: {
    marginBottom: 12,
    backgroundColor: '#1a1a1a',
  },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  topicChip: {
    backgroundColor: '#2a2a2a',
  },
  engagementChip: {
    backgroundColor: '#00D9C0',
  },
  ideaCaption: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    color: '#FFFFFF',
  },
  useIdeaButton: {
    backgroundColor: '#00D9C0',
  },
  divider: {
    marginVertical: 20,
    backgroundColor: '#1a1a1a',
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreChip: {
    height: 32,
    backgroundColor: '#00D9C0',
  },
  captionBox: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
  },
  captionText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  hashtagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtagChip: {
    backgroundColor: '#2a2a2a',
    marginRight: 5,
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginVertical: 15,
  },
  actionButton: {
    flex: 1,
  },
  newIdeaButton: {
    marginBottom: 20,
    borderColor: '#667eea',
  },
});

export default ContentCreatorScreen;
