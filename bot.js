const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

const bot = new TelegramBot(TOKEN, { polling: true });
let userData = {};

console.log('🤖 Бот запущен. Ждёт сообщений...');

function sendStartOptions(chatId) {
  userData[chatId] = {};
  bot.sendMessage(chatId, 'Привет! Что вас интересует?', {
    reply_markup: {
      keyboard: [
        ['👗 Хочу платье', '👠 Хочу обувь'],
        ['💬 Просто задать вопрос', '🔄 Начать сначала']
      ],
      resize_keyboard: true
    }
  });
}

// === /start запускает опрос
bot.onText(/\/start/, (msg) => {
  sendStartOptions(msg.chat.id);
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Если "Начать сначала" нажата
  if (text === '🔄 Начать сначала') {
    sendStartOptions(chatId);
    return;
  }

  // Если не инициализирован пользователь
  if (!userData[chatId]) {
    userData[chatId] = {};
  }

  const user = userData[chatId];

  // Выбор темы
  if (['👗 Хочу платье', '👠 Хочу обувь', '💬 Просто задать вопрос'].includes(text)) {
    user.topic = text;
    bot.sendMessage(chatId, 'Как вас зовут?');
    return;
  }

  if (!user.name) {
    user.name = text;
    bot.sendMessage(chatId, 'Спасибо! Теперь ваш номер телефона:');
  } else if (!user.phone) {
    user.phone = text;
    bot.sendMessage(chatId, 'Напишите короткое сообщение или вопрос:');
  } else if (!user.message) {
    user.message = text;

    const time = new Date().toLocaleString('he-IL');
    const summary = `📥 Новая заявка:\n👤 Имя: ${user.name}\n📞 Телефон: ${user.phone}\n💬 Тема: ${user.topic || 'Не указана'}\n📝 Сообщение: ${user.message}\n🕒 Время: ${time}`;
    bot.sendMessage(ADMIN_CHAT_ID, summary);

    // Выбор в конце: написать Юле или начать сначала
    bot.sendMessage(chatId, 'Спасибо! Мы скоро с вами свяжемся 😊', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💬 Написать Юлии', url: 'https://t.me/Julia_Raskina' },
            { text: '🔄 Пройти заново', callback_data: 'restart' }
          ]
        ]
      }
    });

    userData[chatId] = null;
  }
});

// === Обработка нажатий инлайн-кнопок
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === 'restart') {
    sendStartOptions(chatId);
    bot.answerCallbackQuery(query.id, { text: 'Начинаем заново 🔁' });
  }
});
