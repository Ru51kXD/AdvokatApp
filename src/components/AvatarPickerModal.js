import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  TouchableWithoutFeedback 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const AvatarPickerModal = ({ 
  visible, 
  onClose, 
  onPickFromGallery, 
  onTakePhoto,
  onRemoveAvatar = null,
  hasAvatar = false
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.container}>
          <TouchableWithoutFeedback>
            <View style={styles.content}>
              <Text style={styles.title}>Сменить фото профиля</Text>
              
              <TouchableOpacity 
                style={styles.option} 
                onPress={onPickFromGallery}
              >
                <Ionicons name="images-outline" size={24} color={COLORS.primary} />
                <Text style={styles.optionText}>Выбрать из галереи</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.option} 
                onPress={onTakePhoto}
              >
                <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
                <Text style={styles.optionText}>Сделать снимок</Text>
              </TouchableOpacity>
              
              {hasAvatar && onRemoveAvatar && (
                <TouchableOpacity 
                  style={[styles.option, styles.removeOption]} 
                  onPress={onRemoveAvatar}
                >
                  <Ionicons name="trash-outline" size={24} color={COLORS.error} />
                  <Text style={[styles.optionText, styles.removeText]}>Удалить фото</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={onClose}
              >
                <Text style={styles.cancelText}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 15,
    color: COLORS.text,
  },
  removeOption: {
    borderBottomWidth: 0,
  },
  removeText: {
    color: COLORS.error,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: COLORS.lightGrey,
    borderRadius: 10,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  }
});

export default AvatarPickerModal; 