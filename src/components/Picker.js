import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

// Helper function to ensure we never render objects directly as React children
const safeTextValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    if (Array.isArray(value)) return '[Array]';
    return '[Object]';
  }
  return String(value);
};

const Picker = ({ 
  label, 
  placeholder, 
  items = [], 
  value, 
  onValueChange, 
  error 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  // Ensure all items have valid label and value properties
  const validItems = Array.isArray(items) ? items.filter(item => 
    item && 
    typeof item === 'object' && 
    'value' in item && 
    'label' in item
  ) : [];
  
  const selectedItem = validItems.find(item => item.value === value);
  
  const handleSelect = (selectedValue) => {
    onValueChange(selectedValue);
    setModalVisible(false);
  };
  
  // Safely get display text for the selected item
  const getDisplayText = () => {
    if (!selectedItem) return placeholder || '';
    
    return safeTextValue(selectedItem.label);
  };
  
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{safeTextValue(label)}</Text>}
      
      <TouchableOpacity 
        style={[
          styles.pickerContainer, 
          error ? styles.errorBorder : null
        ]} 
        onPress={() => setModalVisible(true)}
      >
        <Text 
          style={[
            styles.selectedText,
            !value ? styles.placeholderText : null
          ]}
          numberOfLines={1}
        >
          {getDisplayText()}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{safeTextValue(error)}</Text>}
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{safeTextValue(label)}</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={validItems}
                keyExtractor={(item) => String(item.value || Math.random())}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      item.value === value ? styles.selectedOption : null
                    ]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text style={[
                      styles.optionText,
                      item.value === value ? styles.selectedOptionText : null
                    ]}>
                      {safeTextValue(item.label)}
                    </Text>
                    {item.value === value && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  pickerContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
  },
  selectedText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.textSecondary,
  },
  errorBorder: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalContent: {
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  selectedOption: {
    backgroundColor: COLORS.primaryLight,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
});

export default Picker; 