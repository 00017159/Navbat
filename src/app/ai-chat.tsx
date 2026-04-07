import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Send, Bot, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../services/theme';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hello! I'm your ClinicUz AI Health Assistant 🩺\n\nI can help you with:\n• Symptom information\n• General health questions\n• Finding the right specialist\n• Appointment preparation tips\n\nHow can I help you today?",
  },
];

// Placeholder responses until OpenAI API key is provided
const PLACEHOLDER_RESPONSES = [
  "I appreciate your question! Once the OpenAI API key is configured, I'll be able to provide detailed, personalized health guidance. For now, I recommend consulting with one of our specialists through the app.",
  "That's a great health question! My full AI capabilities will be activated soon. In the meantime, you can browse our doctors on the Home screen and book a free appointment.",
  "I understand your concern. While my advanced AI features are being set up, please don't hesitate to book an appointment with our qualified doctors — it's completely free!",
  "Thank you for reaching out! I'm being upgraded with OpenAI-powered intelligence. Soon I'll be able to provide comprehensive health information. For urgent concerns, please visit a doctor.",
];

export default function AIChatScreen() {
  const router = useRouter();
  const { colors, dark } = useTheme();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  let responseIndex = 0;

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Call OpenAI API
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful and professional medical AI assistant for the ClinicUz application. You provide general health guidance, symptom triage, and medical facts. Always remind users to consult a real human doctor for serious or definitive diagnoses.' },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg.content }
          ]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to get response');
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.choices[0].message.content,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error('OpenAI Error:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.aiAvatar}>
            <Bot color="#fff" size={18} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>AI Health Assistant</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Powered by ClinicUz</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === 'user'
                ? [styles.userBubble, { backgroundColor: colors.primary }]
                : [styles.aiBubble, { backgroundColor: dark ? '#334155' : '#F1F5F9' }],
            ]}
          >
            {msg.role === 'assistant' && (
              <View style={styles.botIcon}>
                <Bot color={colors.primary} size={16} />
              </View>
            )}
            <Text
              style={[
                styles.messageText,
                { color: msg.role === 'user' ? '#fff' : colors.text },
              ]}
            >
              {msg.content}
            </Text>
          </View>
        ))}
        {loading && (
          <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: dark ? '#334155' : '#F1F5F9' }]}>
            <View style={styles.botIcon}>
              <Bot color={colors.primary} size={16} />
            </View>
            <View style={styles.typingDots}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.typingText, { color: colors.textSecondary }]}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: dark ? '#334155' : '#F1F5F9', color: colors.text }]}
            placeholder="Ask about your health..."
            placeholderTextColor={colors.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : dark ? '#475569' : '#E2E8F0' }]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Send color={input.trim() ? '#fff' : '#94A3B8'} size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 20, borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#10B981',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 11 },
  messagesContainer: { padding: 16, paddingBottom: 20 },
  messageBubble: {
    maxWidth: '85%', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 20, marginBottom: 12,
  },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  botIcon: { marginBottom: 6 },
  messageText: { fontSize: 15, lineHeight: 22 },
  typingDots: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { fontSize: 13 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    borderTopWidth: 1, gap: 10,
  },
  input: {
    flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
});
