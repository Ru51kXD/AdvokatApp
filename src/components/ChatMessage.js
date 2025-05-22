import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const ChatMessage = ({ message, isOwn, onPressAttachment }) => {
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
  
  // Определяем, есть ли вложения в сообщении
  const hasAttachment = message.attachment || message.image;
  
  // Рендер индикатора статуса сообщения (отправлено, доставлено, прочитано)
  const renderMessageStatus = () => {
    if (isFromGuest) return null;
    
    if (message.read) {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-done" size={14} color={isOwn ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.4)'} />
        </View>
      );
    } else if (message.delivered) {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark" size={14} color={isOwn ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.4)'} />
        </View>
      );
    } else {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="time-outline" size={14} color={isOwn ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.4)'} />
        </View>
      );
    }
  };
  
  // Рендер вложения (если есть)
  const renderAttachment = () => {
    if (!hasAttachment) return null;
    
    if (message.image) {
      return (
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={() => onPressAttachment && onPressAttachment(message)}
        >
          <Image 
            source={{ uri: message.image }} 
            style={styles.attachmentImage} 
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }
    
    if (message.attachment) {
      const fileIcon = getFileIcon(message.attachment);
      const fileName = message.attachment.split('/').pop() || 'Файл';
      
      return (
        <TouchableOpacity 
          style={[styles.fileContainer, isOwn ? styles.ownFileContainer : styles.otherFileContainer]}
          onPress={() => onPressAttachment && onPressAttachment(message)}
        >
          <Ionicons name={fileIcon} size={24} color={isOwn ? COLORS.white : COLORS.primary} />
          <Text 
            style={[styles.fileName, isOwn ? styles.ownFileName : styles.otherFileName]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {fileName}
          </Text>
          <Ionicons 
            name="download-outline" 
            size={20} 
            color={isOwn ? COLORS.white : COLORS.primary} 
          />
        </TouchableOpacity>
      );
    }
    
    return null;
  };
  
  // Определение иконки файла по расширению
  const getFileIcon = (filePath) => {
    if (!filePath) return 'document-outline';
    
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'document-text-outline';
      case 'doc':
      case 'docx':
        return 'document-text-outline';
      case 'xls':
      case 'xlsx':
        return 'calculator-outline';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image-outline';
      case 'mp4':
      case 'mov':
      case 'avi':
        return 'videocam-outline';
      default:
        return 'document-outline';
    }
  };

  return (
    <View style={[
      styles.container,
      isOwn ? styles.ownMessage : styles.otherMessage
    ]}>
      <View style={[
        styles.bubble,
        isOwn ? styles.ownBubble : styles.otherBubble,
        isFromGuest ? styles.guestBubble : null,
        hasAttachment && !message.message ? styles.attachmentOnlyBubble : null
      ]}>
        {renderAttachment()}
        
        {message.message && (
          <Text style={[
            styles.messageText,
            isOwn ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {message.message}
          </Text>
        )}
        
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timeText,
            isOwn ? styles.ownTimeText : styles.otherTimeText
          ]}>
            {formatMessageTime(message.created_at)}
          </Text>
          
          {renderMessageStatus()}
          
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

const { width } = Dimensions.get('window');
const maxImageWidth = width * 0.6;

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
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
  attachmentOnlyBubble: {
    padding: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  ownMessageText: {
    color: COLORS.white,
  },
  otherMessageText: {
    color: COLORS.text,
  },
  messageFooter: {
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
  statusContainer: {
    marginHorizontal: 2,
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
  },
  imageContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  attachmentImage: {
    width: maxImageWidth,
    height: maxImageWidth * 0.75,
    borderRadius: 8,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  ownFileContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  otherFileContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    marginHorizontal: 8,
  },
  ownFileName: {
    color: COLORS.white,
  },
  otherFileName: {
    color: COLORS.text,
  }
});

export default ChatMessage; 