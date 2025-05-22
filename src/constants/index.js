export const LAW_AREAS = [
  { label: 'Уголовное право', value: 'Уголовное право' },
  { label: 'Гражданское право', value: 'Гражданское право' },
  { label: 'Семейное право', value: 'Семейное право' },
  { label: 'Административное право', value: 'Административное право' },
  { label: 'Трудовое право', value: 'Трудовое право' },
  { label: 'Земельное право', value: 'Земельное право' },
  { label: 'Налоговое право', value: 'Налоговое право' },
  { label: 'Корпоративное право', value: 'Корпоративное право' },
  { label: 'Медицинское право', value: 'Медицинское право' },
  { label: 'Интеллектуальная собственность', value: 'Интеллектуальная собственность' },
  { label: 'Другое', value: 'Другое' }
];

export const PRICE_RANGES = [
  { label: 'До 10 000 тенге', value: 'До 10 000 тенге' },
  { label: '10 000 - 30 000 тенге', value: '10 000 - 30 000 тенге' },
  { label: '30 000 - 50 000 тенге', value: '30 000 - 50 000 тенге' },
  { label: '50 000 - 100 000 тенге', value: '50 000 - 100 000 тенге' },
  { label: 'Свыше 100 000 тенге', value: 'Свыше 100 000 тенге' },
  { label: 'Договорная', value: 'Договорная' }
];

export const EXPERIENCE_OPTIONS = [
  { label: 'Менее 1 года', value: 0 },
  { label: '1-3 года', value: 1 },
  { label: '3-5 лет', value: 3 },
  { label: '5-10 лет', value: 5 },
  { label: 'Более 10 лет', value: 10 }
];

export const KAZAKHSTAN_CITIES = [
  { label: 'Астана', value: 'Астана' },
  { label: 'Алматы', value: 'Алматы' },
  { label: 'Шымкент', value: 'Шымкент' },
  { label: 'Караганда', value: 'Караганда' },
  { label: 'Актобе', value: 'Актобе' },
  { label: 'Тараз', value: 'Тараз' },
  { label: 'Павлодар', value: 'Павлодар' },
  { label: 'Усть-Каменогорск', value: 'Усть-Каменогорск' },
  { label: 'Семей', value: 'Семей' },
  { label: 'Атырау', value: 'Атырау' },
  { label: 'Костанай', value: 'Костанай' },
  { label: 'Кызылорда', value: 'Кызылорда' },
  { label: 'Уральск', value: 'Уральск' },
  { label: 'Петропавловск', value: 'Петропавловск' },
  { label: 'Актау', value: 'Актау' },
  { label: 'Темиртау', value: 'Темиртау' },
  { label: 'Туркестан', value: 'Туркестан' },
  { label: 'Кокшетау', value: 'Кокшетау' },
  { label: 'Талдыкорган', value: 'Талдыкорган' },
  { label: 'Экибастуз', value: 'Экибастуз' }
];

export const COLORS = {
  primary: '#2E5BFF',
  secondary: '#1E3A8A',
  background: '#F5F6FA',
  white: '#FFFFFF',
  black: '#000000',
  text: '#1A1A1A',
  textSecondary: '#666666',
  gray: '#8E8E93',
  lightGray: '#E5E5EA',
  border: '#E5E5EA',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FFCC00',
};

export const FONTS = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  h3: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  body1: {
    fontSize: 18,
  },
  body2: {
    fontSize: 16,
  },
  body3: {
    fontSize: 14,
  },
  body4: {
    fontSize: 12,
  },
};

export const SIZES = {
  base: 8,
  padding: 16,
  radius: 12,
  margin: 16,
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
};

export const REQUEST_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const RESPONSE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
}; 