import React from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity,
  Animated,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const SearchBar = ({ 
  value, 
  onChangeText, 
  placeholder = 'Поиск адвокатов...', 
  onSubmit,
  onClear,
  autoFocus = false
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false
    }).start();
  }, [isFocused]);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  
  const handleClear = () => {
    if (onClear) onClear();
    if (onChangeText) onChangeText('');
  };

  const searchBarWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['100%', '100%']
  });

  const shadowOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.2]
  });

  return (
    <Animated.View style={[
      styles.container,
      {
        width: searchBarWidth,
        shadowOpacity: shadowOpacity,
      }
    ]}>
      <View style={styles.searchIcon}>
        <Ionicons name="search" size={20} color={COLORS.grey} />
      </View>
      
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.lightGrey}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
      />
      
      {value ? (
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <View style={styles.clearIcon}>
            <Ionicons name="close-circle" size={18} color={COLORS.grey} />
          </View>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 8,
    paddingRight: 8,
  },
  clearButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearIcon: {
    padding: 8,
  },
});

export default SearchBar; 