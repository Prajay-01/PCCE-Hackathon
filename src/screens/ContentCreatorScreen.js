import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput as RNTextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
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
  Surface,
  IconButton,
  List,
  Text
} from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';

import { useAuth } from '../context/AuthContext';
import { saveGeneratedContent } from '../services/contentGeneratorService';

// AI-powered services
import {
  fetchInstagramPosts,
  analyzeInstagramData,
  generatePersonalizedSuggestions,
  generatePersonalizedCaption,
  generatePersonalizedHashtags,
  getContentStrategy,
} from '../services/instagramAnalyzer';

const ContentCreatorScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [selectedNiche, setSelectedNiche] = useState('tech');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [topic, setTopic] = useState('');
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [generatedHashtags, setGeneratedHashtags] = useState([]);
  const [postIdeas, setPostIdeas] = useState([]);
  const [engagementScore, setEngagementScore] = useState(0);
  const [showIdeas, setShowIdeas] = useState(true);
  
  // Instagram Analysis
  const [instagramData, setInstagramData] = useState(null);
  const [instagramAnalysis, setInstagramAnalysis] = useState(null);
  const [showStrategy, setShowStrategy] = useState(false);
  const [contentStrategy, setContentStrategy] = useState('');
  
  // AI Chat
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    initializeAIAssistant();
  }, []);

  const initializeAIAssistant = async () => {
    setLoading(true);
    try {
      // Try to get Instagram data, but don't require it
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      const connectedAccounts = userData?.connectedAccounts || {};
      
      if (connectedAccounts.instagram?.accessToken) {
        try {
          // Try to fetch Instagram posts
          const posts = await fetchInstagramPosts(connectedAccounts.instagram.accessToken);
          
          if (posts && posts.length > 0) {
            setInstagramData(posts);
            
            // Analyze the data
            const analysis = await analyzeInstagramData(posts);
            setInstagramAnalysis(analysis);
            
            // Generate personalized suggestions
            const suggestions = await generatePersonalizedSuggestions(analysis, selectedPlatform, 5);
            setPostIdeas(suggestions);
            return; // Success!
          }
        } catch (instagramError) {
          console.warn('Instagram API not available:', instagramError);
          // Fall through to manual input mode
        }
      }
      
      // Fallback: Use manual input mode with mock data
      const mockAnalysis = createMockAnalysis(userData, selectedNiche);
      setInstagramAnalysis(mockAnalysis);
      
      // Generate AI suggestions based on niche (without Instagram data)
      const suggestions = await generatePersonalizedSuggestions(mockAnalysis, selectedPlatform, 5);
      setPostIdeas(suggestions);
      
      // Show info message
      Alert.alert(
        '💡 Manual Mode',
        'Instagram data not available. AI will learn from your preferences as you create content!\n\nTip: The more captions you generate, the better AI gets at your style.',
        [{ text: 'Got it!' }]
      );
      
    } catch (error) {
      console.error('Error initializing AI assistant:', error);
      
      // Final fallback with basic data
      const basicAnalysis = createMockAnalysis(null, selectedNiche);
      setInstagramAnalysis(basicAnalysis);
      
      const suggestions = await generatePersonalizedSuggestions(basicAnalysis, selectedPlatform, 5);
      setPostIdeas(suggestions);
    } finally {
      setLoading(false);
    }
  };

  // Create mock analysis data when Instagram is not available
  const createMockAnalysis = (userData, niche) => {
    return {
      totalPosts: 0,
      avgLikes: 100,
      avgComments: 10,
      topCaptions: [
        `Check out this amazing ${niche} content! 🚀`,
        `New ${niche} insights you don't want to miss 💡`,
        `The future of ${niche} starts here ✨`,
      ],
      topKeywords: [niche, 'content', 'tips', 'guide', 'tutorial'],
      bestPostingHour: 19, // 7 PM default
      topPerformingPosts: [],
      isManualMode: true,
    };
  };

  const handleGenerateCaption = async () => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic first!');
      return;
    }

    if (!instagramAnalysis) {
      Alert.alert(
        'Not Ready',
        'AI is still initializing. Please wait a moment and try again.'
      );
      return;
    }

    setAiLoading(true);
    try {
      // Use OpenAI with available data (Instagram or mock)
      const caption = await generatePersonalizedCaption(topic, instagramAnalysis, selectedPlatform);
      setGeneratedCaption(caption);
      
      // Generate hashtags
      const hashtags = await generatePersonalizedHashtags(caption, instagramAnalysis);
      setGeneratedHashtags(hashtags);
      
      // Set engagement prediction
      setEngagementScore(instagramAnalysis.avgLikes);
      
      if (instagramAnalysis.isManualMode) {
        // Save this caption to learn from it
        saveUserPreference(caption);
      }
      
    } catch (error) {
      console.error('Error generating caption:', error);
      Alert.alert(
        'Generation Failed',
        'Unable to generate AI caption. Please check your OpenAI API key in the config file and try again.\n\nError: ' + error.message
      );
    } finally {
      setAiLoading(false);
    }
  };

  const saveUserPreference = async (caption) => {
    try {
      // Save to Firestore to learn user's style over time
      await firestore().collection('users').doc(user.uid).collection('captions').add({
        caption,
        topic,
        platform: selectedPlatform,
        niche: selectedNiche,
        createdAt: new Date(),
      });
    } catch (error) {
      console.warn('Could not save preference:', error);
    }
  };

  const handleUseIdea = (idea) => {
    setTopic(idea.topic);
    setGeneratedCaption(idea.caption);
    setGeneratedHashtags(idea.caption.match(/#\w+/g) || []);
    setEngagementScore(idea.estimatedEngagement);
    setShowIdeas(false);
  };

  const handleRefreshSuggestions = async () => {
    if (!instagramAnalysis) {
      Alert.alert('Connect Instagram', 'Please connect your Instagram account first.');
      return;
    }
    
    setLoading(true);
    try {
      const suggestions = await generatePersonalizedSuggestions(instagramAnalysis, selectedPlatform, 5);
      setPostIdeas(suggestions);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleGetStrategy = async () => {
    if (!instagramAnalysis) {
      Alert.alert('Connect Instagram', 'Please connect your Instagram account first.');
      return;
    }
    
    setAiLoading(true);
    try {
      const strategy = await getContentStrategy(instagramAnalysis);
      setContentStrategy(strategy);
      setShowStrategy(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to get content strategy');
    } finally {
      setAiLoading(false);
    }
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

  const handleImproveCaption = async () => {
    if (!generatedCaption) {
      Alert.alert('Error', 'Generate a caption first!');
      return;
    }

    setAiLoading(true);
    try {
      const result = await improveCaption(generatedCaption, selectedPlatform);
      setImprovements(result);
      Alert.alert('✨ Caption Improved!', 'Check the suggestions below');
    } catch (error) {
      console.error('Error improving caption:', error);
      Alert.alert('Error', 'Failed to improve caption. Check your API key.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyImprovement = () => {
    if (improvements && improvements.improved) {
      setGeneratedCaption(improvements.improved);
      setImprovements(null);
      Alert.alert('Success', 'Improved caption applied!');
    }
  };

  const handleAIChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages([...chatMessages, userMessage]);
    setChatInput('');
    setAiLoading(true);

    try {
      const response = await chatWithAI(chatInput, chatMessages);
      const aiMessage = { role: 'assistant', content: response };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error in AI chat:', error);
      Alert.alert('Error', 'Failed to get AI response. Check your API key.');
    } finally {
      setAiLoading(false);
    }
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Title style={styles.headerTitle}>🤖 AI Content Assistant</Title>
            <Paragraph style={styles.headerSubtitle}>
              {instagramAnalysis?.isManualMode 
                ? '✍️ Learning your style as you create'
                : '📊 Powered by your Instagram data'}
            </Paragraph>
          </View>
          <View style={styles.headerButtons}>
            <IconButton
              icon="chart-line"
              iconColor="#00D9C0"
              size={24}
              onPress={handleGetStrategy}
              disabled={!instagramAnalysis}
            />
          </View>
        </View>
        
        {/* Instagram Analysis Stats */}
        {instagramAnalysis && (
          <Surface style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {instagramAnalysis.isManualMode ? '✍️' : instagramAnalysis.totalPosts}
                </Text>
                <Text style={styles.statLabel}>
                  {instagramAnalysis.isManualMode ? 'Manual Mode' : 'Posts Analyzed'}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{instagramAnalysis.avgLikes}</Text>
                <Text style={styles.statLabel}>
                  {instagramAnalysis.isManualMode ? 'Target Likes' : 'Avg Likes'}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{instagramAnalysis.bestPostingHour}:00</Text>
                <Text style={styles.statLabel}>Best Time</Text>
              </View>
            </View>
          </Surface>
        )}
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

        {showIdeas ? (
          // Post Ideas Section
          <>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>💡 Personalized Suggestions</Title>
              <Button mode="text" onPress={handleRefreshSuggestions} textColor="#00D9C0">
                Refresh
              </Button>
            </View>
            {loading ? (
              <ActivityIndicator size="large" color="#00D9C0" style={{ marginTop: 20 }} />
            ) : (
              postIdeas.map((idea) => (
                <Card key={idea.id} style={styles.ideaCard} mode="elevated">
                  <Card.Content>
                    <View style={styles.ideaHeader}>
                      <Chip icon="lightbulb" style={styles.topicChip} textStyle={{color: '#fff'}}>
                        {idea.topic}
                      </Chip>
                      <Chip icon="chart-line" style={styles.engagementChip} textStyle={{color: '#fff'}}>
                        ~{idea.estimatedEngagement} likes
                      </Chip>
                    </View>
                    <Paragraph style={styles.ideaCaption}>{idea.caption}</Paragraph>
                    {idea.bestTime && (
                      <Text style={styles.bestTimeText}>🕐 Best time: {idea.bestTime}</Text>
                    )}
                    <Button
                      mode="contained"
                      onPress={() => handleUseIdea(idea)}
                      style={styles.useIdeaButton}
                      buttonColor="#00D9C0"
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
              icon="robot"
              onPress={handleGenerateCaption}
              loading={aiLoading}
              disabled={aiLoading || !instagramAnalysis}
              style={styles.generateButton}
              contentStyle={styles.generateButtonContent}
              buttonColor="#00D9C0"
            >
              {instagramAnalysis?.isManualMode 
                ? '✨ Generate AI Caption (Learning Mode)'
                : '✨ Generate AI Caption (Based on Your Data)'}
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

            {/* AI Improvement Button */}
            {useAI && (
              <Button
                mode="outlined"
                icon="lightbulb"
                onPress={handleImproveCaption}
                loading={aiLoading}
                disabled={aiLoading}
                style={styles.improveButton}
              >
                🚀 Improve with AI
              </Button>
            )}

            {/* Improvements Section */}
            {improvements && (
              <Card style={styles.card}>
                <Card.Content>
                  <Title style={styles.sectionTitle}>✨ AI Improvements</Title>
                  
                  <View style={styles.scoreComparison}>
                    <Chip icon="arrow-down" style={styles.oldScore}>
                      Original: {improvements.originalScore}%
                    </Chip>
                    <Chip icon="arrow-up" style={styles.newScore}>
                      Improved: {improvements.improvedScore}%
                    </Chip>
                  </View>

                  <Surface style={styles.improvedCaptionBox} elevation={1}>
                    <Paragraph style={styles.captionText}>{improvements.improved}</Paragraph>
                  </Surface>

                  <Title style={[styles.sectionTitle, { fontSize: 16, marginTop: 15 }]}>
                    💡 Suggestions:
                  </Title>
                  {improvements.suggestions && improvements.suggestions.map((suggestion, index) => (
                    <View key={index} style={styles.suggestionItem}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </View>
                  ))}

                  <Button
                    mode="contained"
                    icon="check"
                    onPress={handleApplyImprovement}
                    style={styles.applyButton}
                  >
                    Apply Improved Version
                  </Button>
                </Card.Content>
              </Card>
            )}

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

      {/* AI Chat Modal */}
      <Modal
        visible={showAIChat}
        onDismiss={() => setShowAIChat(false)}
        animationType="slide"
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.chatHeader}>
            <Title style={styles.chatTitle}>💬 AI Assistant</Title>
            <IconButton
              icon="close"
              iconColor="#FFFFFF"
              onPress={() => setShowAIChat(false)}
            />
          </View>

          <ScrollView style={styles.chatMessages} ref={scrollViewRef}>
            {chatMessages.length === 0 && (
              <Card style={styles.welcomeCard}>
                <Card.Content>
                  <Paragraph style={styles.welcomeText}>
                    👋 Hi! I'm your AI growth assistant. Ask me anything about:
                    {'\n\n'}• Content strategy
                    {'\n'}• Engagement tips
                    {'\n'}• Hashtag advice
                    {'\n'}• Trending topics
                    {'\n'}• Growth tactics
                  </Paragraph>
                </Card.Content>
              </Card>
            )}
            
            {chatMessages.map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.chatBubble,
                  msg.role === 'user' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text style={styles.chatText}>{msg.content}</Text>
              </View>
            ))}
            
            {aiLoading && (
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color="#00D9C0" />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.chatInputContainer}>
            <TextInput
              mode="outlined"
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Ask me anything..."
              style={styles.chatInput}
              multiline
              outlineColor="#00D9C0"
              activeOutlineColor="#00D9C0"
              onSubmitEditing={handleAIChat}
            />
            <IconButton
              icon="send"
              iconColor="#00D9C0"
              size={28}
              onPress={handleAIChat}
              disabled={!chatInput.trim() || aiLoading}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Strategy Modal */}
      <Modal
        visible={showStrategy}
        onDismiss={() => setShowStrategy(false)}
        contentContainerStyle={styles.strategyModal}
      >
        <View style={styles.strategyHeader}>
          <Title style={styles.strategyTitle}>📊 Your Content Strategy</Title>
          <IconButton
            icon="close"
            iconColor="#fff"
            onPress={() => setShowStrategy(false)}
          />
        </View>
        <ScrollView style={styles.strategyContent}>
          <Text style={styles.strategyText}>{contentStrategy}</Text>
        </ScrollView>
      </Modal>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  aiToggle: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  aiChip: {
    backgroundColor: '#2a2a2a',
  },
  aiHint: {
    fontSize: 11,
    color: '#808080',
    marginTop: 4,
    marginLeft: 4,
  },
  improveButton: {
    marginTop: 10,
    borderColor: '#00D9C0',
  },
  scoreComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  oldScore: {
    backgroundColor: '#ff6b6b',
  },
  newScore: {
    backgroundColor: '#51cf66',
  },
  improvedCaptionBox: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#1a3a2a',
    borderWidth: 2,
    borderColor: '#00D9C0',
  },
  suggestionItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 10,
  },
  bulletPoint: {
    color: '#00D9C0',
    marginRight: 8,
    fontSize: 16,
  },
  suggestionText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  applyButton: {
    marginTop: 15,
    backgroundColor: '#00D9C0',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  chatTitle: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  chatMessages: {
    flex: 1,
    padding: 15,
  },
  welcomeCard: {
    backgroundColor: '#1a1a1a',
    marginBottom: 10,
  },
  welcomeText: {
    color: '#FFFFFF',
    lineHeight: 22,
  },
  chatBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#00D9C0',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a2a2a',
  },
  chatText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    maxWidth: '60%',
  },
  loadingText: {
    color: '#808080',
    marginLeft: 10,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  chatInput: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#2a2a2a',
    maxHeight: 100,
  },
  statsCard: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: '#00D9C0',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#808080',
    fontSize: 12,
    marginTop: 4,
  },
  bestTimeText: {
    color: '#00D9C0',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 10,
  },
  strategyModal: {
    backgroundColor: '#1a1a1a',
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  strategyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  strategyContent: {
    padding: 20,
  },
  strategyText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 24,
  },
});

export default ContentCreatorScreen;
