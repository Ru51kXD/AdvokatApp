import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants';

// Helper function to safely render any value
const safeRender = (value) => {
  try {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object') {
      if (React.isValidElement(value)) return value; // Return React elements as is
      if (value.hasOwnProperty('label')) return value.label;
      if (value.hasOwnProperty('name')) return value.name;
      if (value.hasOwnProperty('value')) return value.value;
      if (value.hasOwnProperty('id')) return String(value.id);
      // Предотвращаем преобразование в JSON, что может вызвать ошибку при циклических структурах
      return ''; // Возвращаем пустую строку вместо JSON.stringify
    }
    return String(value);
  } catch (error) {
    console.error('Error in safeRender:', error);
    return ''; // В случае любой ошибки возвращаем пустую строку
  }
};

const Card = ({ children, style, onPress }) => {
  if (onPress) {
    return (
      <TouchableOpacity 
        style={[styles.card, style]} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

// Subcomponents for structured card content
Card.Title = ({ children, style }) => (
  <Text style={[styles.title, style]}>
    {typeof children === 'object' && !React.isValidElement(children) ? safeRender(children) : children}
  </Text>
);

Card.Content = ({ children, style }) => (
  <View style={[styles.content, style]}>{children}</View>
);

Card.Footer = ({ children, style }) => (
  <View style={[styles.footer, style]}>{children}</View>
);

Card.Row = ({ children, style, spaceBetween = false }) => (
  <View style={[
    styles.row, 
    spaceBetween && styles.spaceBetween,
    style
  ]}>
    {children}
  </View>
);

Card.Label = ({ children, style }) => (
  <Text style={[styles.label, style]}>
    {typeof children === 'object' && !React.isValidElement(children) ? safeRender(children) : children}
  </Text>
);

Card.Value = ({ children, style }) => (
  <Text style={[styles.value, style]}>
    {typeof children === 'object' && !React.isValidElement(children) ? safeRender(children) : children}
  </Text>
);

Card.Badge = ({ text, type = 'default', style }) => {
  const badgeStyle = () => {
    switch (type) {
      case 'success':
        return styles.badgeSuccess;
      case 'warning':
        return styles.badgeWarning;
      case 'error':
        return styles.badgeError;
      default:
        return styles.badgeDefault;
    }
  };
  
  const textStyle = () => {
    switch (type) {
      case 'success':
        return styles.badgeSuccessText;
      case 'warning':
        return styles.badgeWarningText;
      case 'error':
        return styles.badgeErrorText;
      default:
        return styles.badgeDefaultText;
    }
  };
  
  return (
    <View style={[styles.badge, badgeStyle(), style]}>
      <Text style={[styles.badgeText, textStyle()]}>
        {typeof text === 'object' ? safeRender(text) : text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  content: {
    marginBottom: 12,
  },
  footer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGrey,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 8,
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    flex: 2,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeDefault: {
    backgroundColor: COLORS.lightGrey,
  },
  badgeSuccess: {
    backgroundColor: COLORS.success + '20',
  },
  badgeWarning: {
    backgroundColor: '#FFC107' + '20',
  },
  badgeError: {
    backgroundColor: COLORS.error + '20',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  badgeDefaultText: {
    color: COLORS.text,
  },
  badgeSuccessText: {
    color: COLORS.success,
  },
  badgeWarningText: {
    color: '#FFC107',
  },
  badgeErrorText: {
    color: COLORS.error,
  },
});

export default Card; 