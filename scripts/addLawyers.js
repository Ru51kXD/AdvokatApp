// Импортируем модуль для добавления адвокатов
const { addLawyersDirectly } = require('../src/utils/seedDatabase');

console.log('Запускаем добавление адвокатов в базу данных...');

// Запускаем функцию добавления
addLawyersDirectly()
  .then(result => {
    if (result.success) {
      console.log(`Успех! Добавлено ${result.count} адвокатов.`);
    } else {
      console.error(`Ошибка: ${result.error}`);
    }
  })
  .catch(error => {
    console.error('Произошла ошибка:', error);
  })
  .finally(() => {
    console.log('Скрипт выполнен.');
    // Явно завершаем процесс, чтобы он не висел
    setTimeout(() => process.exit(0), 1000);
  }); 