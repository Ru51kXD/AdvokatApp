import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { COLORS } from '../constants';

const Picker = ({
  label,
  value,
  onValueChange,
  items = [],
  placeholder = 'Выберите...',
  error,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const selectedItem = items.find(item => item === value || item.value === value);
  const displayValue = selectedItem 
    ? (typeof selectedItem === 'string' ? selectedItem : selectedItem.label) 
    : null;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[styles.pickerContainer, error && styles.errorInput]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={displayValue ? styles.valueText : styles.placeholderText}>
          {displayValue || placeholder}
        </Text>
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label || 'Выберите значение'}</Text>
            
            <FlatList
              data={items}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => {
                const itemValue = typeof item === 'string' ? item : item.value;
                const itemLabel = typeof item === 'string' ? item : item.label;
                const isSelected = value === itemValue;
                
                return (
                  <TouchableOpacity
                    style={[styles.itemContainer, isSelected && styles.selectedItem]}
                    onPress={() => {
                      onValueChange(itemValue);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
                      {itemLabel}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  placeholderText: {
    color: COLORS.grey,
    fontSize: 16,
  },
  valueText: {
    color: COLORS.text,
    fontSize: 16,
  },
  errorInput: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  itemContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  itemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  selectedItem: {
    backgroundColor: COLORS.secondary + '40',
  },
  selectedItemText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGrey,
  },
  closeButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Picker; 