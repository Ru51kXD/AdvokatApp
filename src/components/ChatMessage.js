import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import { format } from 'date-fns';
import ru from 'date-fns/locale/ru';

const ChatMessage = ({ message, isOwn }) => {
  // Форматирование времени сообщения
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.setHours(0, 0, 0, 0) === now.setHours(0, 0, 0, 0);
    
    if (isToday) {
      return format(date, 'HH:mm');
    } else {
      return format(date, 'd MMM, HH:mm', { locale: ru });
    }
  };

  return (
    <View style={[
      styles.container,
      isOwn ? styles.ownMessage : styles.otherMessage
    ]}>
      <View style={[
        styles.bubble,
        isOwn ? styles.ownBubble : styles.otherBubble
      ]}>
        <Text style={[
          styles.messageText,
          isOwn ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {message.message}
        </Text>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {formatMessageTime(message.created_at)}
          </Text>
          {isOwn && (
            <Text style={styles.statusText}>
              {message.read ? 'Прочитано' : 'Отправлено'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: 'row',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 4,
  },
  ownBubble: {
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: COLORS.lightGrey,
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  ownMessageText: {
    color: COLORS.white,
  },
  otherMessageText: {
    color: COLORS.text,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#rgba(255, 255, 255, 0.7)',
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#rgba(255, 255, 255, 0.7)',
  },
});

export default ChatMessage; 