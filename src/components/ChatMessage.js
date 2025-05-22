import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

const ChatMessage = ({ message, isOwn }) => {
  // Форматирование времени сообщения
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      
      // Проверяем, сегодня ли было отправлено сообщение
      const isToday = date.getDate() === now.getDate() &&
                      date.getMonth() === now.getMonth() &&
                      date.getFullYear() === now.getFullYear();
      
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString([], { day: 'numeric', month: 'short' }) + 
               ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Определяем, является ли сообщение от гостя
  const isFromGuest = message.is_from_guest || message.sender_id?.toString().startsWith('guest_');

  return (
    <View style={[
      styles.container,
      isOwn ? styles.ownMessage : styles.otherMessage
    ]}>
      <View style={[
        styles.bubble,
        isOwn ? styles.ownBubble : styles.otherBubble,
        isFromGuest ? styles.guestBubble : null
      ]}>
        <Text style={[
          styles.messageText,
          isOwn ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {message.message}
        </Text>
        <View style={styles.timeContainer}>
          <Text style={[
            styles.timeText,
            isOwn ? styles.ownTimeText : styles.otherTimeText
          ]}>
            {formatMessageTime(message.created_at)}
          </Text>
          {isOwn && !isFromGuest && (
            <Text style={styles.statusText}>
              {message.read ? 'Прочитано' : 'Отправлено'}
            </Text>
          )}
          {isFromGuest && (
            <Text style={[styles.guestLabel, isOwn ? styles.ownGuestLabel : styles.otherGuestLabel]}>
              Гость
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
  guestBubble: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)', 
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
    marginRight: 4,
  },
  ownTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimeText: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  guestLabel: {
    fontSize: 11,
    fontStyle: 'italic',
    marginLeft: 4,
  },
  ownGuestLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherGuestLabel: {
    color: 'rgba(0, 0, 0, 0.5)',
  }
});

export default ChatMessage; 