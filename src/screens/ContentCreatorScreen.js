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

import { useAuth } from '../context/AuthContext';
import {
  generatePostIdeas,
  generateCaption,
  generateHashtags,
  saveGeneratedContent,
  predictEngagement,
  getTrendingTopics,
} from '../services/contentGeneratorService';

import {
  generateAIPostIdeas,
  generateAICaption,
  generateAIHashtags,
  improveCaption,
  chatWithAI,
  getTrendingContentIdeas,
  generateContentCalendar,
} from '../services/aiService';

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
  
  // New AI features
  const [useAI, setUseAI] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [improvements, setImprovements] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [contentCalendar, setContentCalendar] = useState('');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    loadPostIdeas();
  }, [selectedPlatform, selectedNiche, useAI]);

  const loadPostIdeas = async () => {
    setLoading(true);
    try {
      if (useAI) {
        // Use Gemini AI for better ideas
        try {
          const aiIdeas = await generateAIPostIdeas(selectedNiche, selectedPlatform, selectedTone, 5);
          setPostIdeas(aiIdeas);
        } catch (aiError) {
          console.warn('AI generation failed, falling back to templates:', aiError);
          Alert.alert(
            '⚠️ AI Mode Unavailable', 
            'Using template mode instead. Please check your internet connection or API key configuration.',
            [{ text: 'OK' }]
          );
          // Fallback to template-based
          const ideas = await generatePostIdeas(user.uid, selectedNiche, selectedPlatform);
          setPostIdeas(ideas);
        }
      } else {
        // Use template-based ideas
        const ideas = await generatePostIdeas(user.uid, selectedNiche, selectedPlatform);
        setPostIdeas(ideas);
      }
    } catch (error) {
      console.error('Error loading ideas:', error);
      // Final fallback
      const ideas = await generatePostIdeas(user.uid, selectedNiche, selectedPlatform);
      setPostIdeas(ideas);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCaption = async () => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic first!');
      return;
    }

    setAiLoading(true);
    try {
      let caption, hashtags;
      
      if (useAI) {
        // Use Gemini AI for better quality
        try {
          caption = await generateAICaption(topic, selectedPlatform, selectedTone);
          setGeneratedCaption(caption);
          
          hashtags = await generateAIHashtags(caption, selectedPlatform, selectedNiche, 10);
          setGeneratedHashtags(hashtags);
        } catch (aiError) {
          console.warn('AI caption generation failed, using templates:', aiError);
          Alert.alert(
            '⚠️ AI Unavailable',
            'Generated using templates instead. AI features may be temporarily unavailable.',
            [{ text: 'OK' }]
          );
          // Fallback to templates
          caption = generateCaption(topic, selectedPlatform, selectedTone);
          setGeneratedCaption(caption);
          
          hashtags = generateHashtags(caption, selectedPlatform, selectedNiche, 10);
          setGeneratedHashtags(hashtags);
        }
      } else {
        // Use template-based generation
        caption = generateCaption(topic, selectedPlatform, selectedTone);
        setGeneratedCaption(caption);
        
        hashtags = generateHashtags(caption, selectedPlatform, selectedNiche, 10);
        setGeneratedHashtags(hashtags);
      }

      // Predict engagement
      const score = predictEngagement(caption, hashtags, selectedPlatform, new Date());
      setEngagementScore(score);
      
      setShowIdeas(false);
      setImprovements(null);
    } catch (error) {
      console.error('Error generating content:', error);
      Alert.alert('Error', 'Failed to generate content. Please try again.');
    } finally {
      setAiLoading(false);
    }
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

  const handleGenerateCalendar = async () => {
    setAiLoading(true);
    try {
      const calendar = await generateContentCalendar(selectedNiche, selectedPlatform, 7);
      setContentCalendar(calendar);
      setShowCalendar(true);
    } catch (error) {
      console.error('Error generating calendar:', error);
      Alert.alert('Error', 'Failed to generate calendar. Check your API key.');
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

  const trendingTopics = getTrendingTopics(selectedNiche);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Title style={styles.headerTitle}>Growify AI</Title>
            <Paragraph style={styles.headerSubtitle}>
              @{user?.displayName?.toLowerCase().replace(/\s+/g, '') || user?.email?.split('@')[0] || 'user'}
            </Paragraph>
          </View>
          <View style={styles.headerButtons}>
            <IconButton
              icon="chat"
              iconColor="#00D9C0"
              size={24}
              onPress={() => setShowAIChat(true)}
            />
            <IconButton
              icon="calendar"
              iconColor="#00D9C0"
              size={24}
              onPress={handleGenerateCalendar}
            />
          </View>
        </View>
        
        {/* AI Toggle */}
        <View style={styles.aiToggle}>
          <Chip
            icon={useAI ? "robot" : "text"}
            selected={useAI}
            onPress={() => setUseAI(!useAI)}
            style={styles.aiChip}
            selectedColor="#00D9C0"
          >
            {useAI ? '🤖 Gemini AI Powered' : '📝 Template Mode'}
          </Chip>
          {useAI && (
            <Text style={styles.aiHint}>Higher quality, slower</Text>
          )}
        </View>
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
              loading={aiLoading}
              disabled={aiLoading}
              style={styles.generateButton}
              contentStyle={styles.generateButtonContent}
            >
              {useAI ? '✨ Generate with AI' : 'Generate Content'}
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

      {/* Content Calendar Modal */}
      <Modal
        visible={showCalendar}
        onDismiss={() => setShowCalendar(false)}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.chatHeader}>
            <Title style={styles.chatTitle}>📅 7-Day Content Calendar</Title>
            <IconButton
              icon="close"
              iconColor="#FFFFFF"
              onPress={() => setShowCalendar(false)}
            />
          </View>

          <ScrollView style={styles.calendarContent}>
            {aiLoading ? (
              <ActivityIndicator size="large" color="#00D9C0" style={{ marginTop: 50 }} />
            ) : (
              <Card style={styles.calendarCard}>
                <Card.Content>
                  <Text style={styles.calendarText}>{contentCalendar}</Text>
                </Card.Content>
              </Card>
            )}
          </ScrollView>

          <Button
            mode="contained"
            onPress={() => setShowCalendar(false)}
            style={styles.closeCalendarButton}
          >
            Close
          </Button>
        </View>
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
  calendarContent: {
    flex: 1,
    padding: 15,
  },
  calendarCard: {
    backgroundColor: '#1a1a1a',
  },
  calendarText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 22,
  },
  closeCalendarButton: {
    margin: 15,
    backgroundColor: '#00D9C0',
  },
});

export default ContentCreatorScreen;
