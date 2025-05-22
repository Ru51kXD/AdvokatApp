import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  Animated,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, LAW_AREAS, PRICE_RANGES, KAZAKHSTAN_CITIES, EXPERIENCE_OPTIONS } from '../../constants';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Picker from '../../components/Picker';
import SearchBar from '../../components/SearchBar';

// Helper function to validate and format picker items
const validatePickerItems = (items) => {
  if (!Array.isArray(items)) return [];
  
  return items.filter(item => 
    item && 
    typeof item === 'object' && 
    'value' in item && 
    'label' in item &&
    (typeof item.label === 'string' || typeof item.label === 'number')
  );
};

// Helper function to ensure all values are primitive (not objects)
const sanitizeValueForRendering = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'object') {
    if (value.hasOwnProperty('label')) return value.label;
    if (value.hasOwnProperty('name')) return value.name;
    if (value.hasOwnProperty('value')) return value.value;
    if (value.hasOwnProperty('id')) return value.id;
    return JSON.stringify(value);
  }
  return String(value);
};

const SearchScreen = ({ navigation }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState([]);
  
  // Определение категорий для поиска - используем строковые значения вместо объектов
  const categories = [
    { id: 1, name: 'Уголовное право' },
    { id: 2, name: 'Гражданское право' },
    { id: 3, name: 'Семейное право' },
    { id: 4, name: 'Налоговое право' },
    { id: 5, name: 'Трудовое право' }
  ];
  
  // Определение фильтров - убедимся, что все значения строковые
  const filters = [
    { id: 1, name: 'Рейтинг > 4.5' },
    { id: 2, name: 'Опыт > 5 лет' },
    { id: 3, name: 'Бесплатная консультация' },
    { id: 4, name: 'Online консультация' },
  ];

  const handleSearch = (values) => {
    // Убедимся, что передаем только примитивные значения, а не объекты
    const searchParams = {
      specialization: values.specialization ? String(values.specialization) : '',
      priceRange: values.priceRange ? String(values.priceRange) : '',
      city: values.city ? String(values.city) : '',
      minExperience: values.minExperience ? String(values.minExperience) : '',
      minRating: values.minRating ? Number(values.minRating) : '',
      query: searchQuery ? String(searchQuery) : '',
      category: selectedCategory ? Number(selectedCategory) : null,
      additionalFilters: selectedFilters ? [...selectedFilters] : [],
    };
    
    // Navigate to LawyerListScreen with search filters
    navigation.navigate('LawyerList', { filters: searchParams });
  };

  const handleCreateRequest = () => {
    navigation.navigate('Request');
  };
  
  const toggleFilter = (filterId) => {
    if (selectedFilters.includes(filterId)) {
      setSelectedFilters(selectedFilters.filter(id => id !== filterId));
    } else {
      setSelectedFilters([...selectedFilters, filterId]);
    }
  };

  // Validate and format data for pickers - ensure we only have valid items
  const validCities = validatePickerItems(KAZAKHSTAN_CITIES) || [];
  const validPriceRanges = validatePickerItems(PRICE_RANGES) || [];
  const validExperienceOptions = validatePickerItems(EXPERIENCE_OPTIONS) || [];

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Найдите юриста</Text>
          <Text style={styles.subtitle}>
            Все юристы Казахстана в одном приложении
          </Text>
        </View>

        {/* Современный поисковый компонент */}
        <SearchBar
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(String(text))}
          placeholder="Поиск по имени, специализации..."
          onSubmit={() => {
            const values = {
              specialization: '',
              priceRange: '',
              city: '',
              minExperience: '',
              minRating: '',
            };
            handleSearch(values);
          }}
        />
        
        {/* Категории */}
        <Text style={styles.sectionTitle}>Категории</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={typeof category.id === 'number' ? category.id : String(category.id)}
              style={[
                styles.categoryItem,
                selectedCategory === category.id && styles.categoryItemSelected
              ]}
              onPress={() => setSelectedCategory(
                selectedCategory === category.id ? null : category.id
              )}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextSelected
                ]}
              >
                {typeof category.name === 'string' ? category.name : String(category.name)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Фильтры */}
        <View style={styles.filtersSection}>
          <View style={styles.filtersTitleRow}>
            <Text style={styles.sectionTitle}>Фильтры</Text>
            {selectedFilters.length > 0 && (
              <TouchableOpacity onPress={() => setSelectedFilters([])}>
                <Text style={styles.clearFiltersText}>Сбросить</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.filtersContainer}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={typeof filter.id === 'number' ? filter.id : String(filter.id)}
                style={[
                  styles.filterItem,
                  selectedFilters.includes(filter.id) && styles.filterItemSelected
                ]}
                onPress={() => toggleFilter(filter.id)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilters.includes(filter.id) && styles.filterTextSelected
                  ]}
                >
                  {typeof filter.name === 'string' ? filter.name : String(filter.name)}
                </Text>
                {selectedFilters.includes(filter.id) && (
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Formik
          initialValues={{
            specialization: '',
            priceRange: '',
            city: '',
            minExperience: '',
            minRating: '',
          }}
          onSubmit={handleSearch}
        >
          {({ handleSubmit, setFieldValue, values }) => (
            <View style={styles.formContainer}>
              <TouchableOpacity
                style={styles.filtersToggle}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Text style={styles.filtersToggleText}>
                  {showFilters ? 'Скрыть расширенные фильтры' : 'Расширенные фильтры'}
                </Text>
                <Ionicons
                  name={showFilters ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>

              {showFilters && (
                <View style={styles.additionalFilters}>
                  <Picker
                    label="Город"
                    placeholder="Выберите город"
                    items={validCities}
                    value={values.city}
                    onValueChange={(value) => setFieldValue('city', value)}
                  />
                  
                  <Picker
                    label="Стоимость услуг"
                    placeholder="Выберите диапазон стоимости"
                    items={validPriceRanges}
                    value={values.priceRange}
                    onValueChange={(value) => setFieldValue('priceRange', value)}
                  />

                  <Picker
                    label="Минимальный опыт"
                    placeholder="Выберите минимальный опыт"
                    items={validExperienceOptions}
                    value={values.minExperience}
                    onValueChange={(value) => setFieldValue('minExperience', value)}
                  />

                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingLabel}>Минимальный рейтинг</Text>
                    <View style={styles.ratingButtons}>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <TouchableOpacity
                          key={rating}
                          style={[
                            styles.ratingButton,
                            values.minRating === rating && styles.ratingButtonSelected,
                          ]}
                          onPress={() => setFieldValue('minRating', rating)}
                        >
                          <Text
                            style={[
                              styles.ratingButtonText,
                              values.minRating === rating && styles.ratingButtonTextSelected,
                            ]}
                          >
                            {rating}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              <Button
                title="Найти адвоката"
                onPress={handleSubmit}
                style={styles.submitButton}
              />
            </View>
          )}
        </Formik>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>или</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.requestSection}>
          <Text style={styles.requestTitle}>Создайте заявку</Text>
          <Text style={styles.requestDescription}>
            Опишите вашу проблему, и юристы сами предложат свои услуги
          </Text>
          <Button
            title="Создать заявку"
            variant="outline"
            onPress={handleCreateRequest}
            style={styles.requestButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
  },
  categoriesContainer: {
    paddingVertical: 8,
  },
  categoryItem: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  categoryItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: COLORS.white,
  },
  filtersSection: {
    marginTop: 8,
  },
  filtersTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearFiltersText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  filterItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.text,
    fontSize: 14,
    marginRight: 4,
  },
  filterTextSelected: {
    color: COLORS.white,
  },
  formContainer: {
    marginTop: 4,
  },
  filtersToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: COLORS.black,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  filtersToggleText: {
    color: COLORS.primary,
    fontSize: 16,
    marginRight: 4,
    fontWeight: '500',
  },
  additionalFilters: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  ratingContainer: {
    marginBottom: 8,
    marginTop: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  ratingButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  ratingButtonTextSelected: {
    color: COLORS.white,
  },
  submitButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGrey,
  },
  dividerText: {
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  requestSection: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  requestTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  requestDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  requestButton: {
    marginTop: 8,
  },
});

export default SearchScreen; 