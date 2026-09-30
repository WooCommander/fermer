import process from 'node:process'

const token = process.env.TELEGRAM_BOT_TOKEN
const miniAppUrl = process.env.MINI_APP_URL
const apiUrl = process.env.API_URL ?? 'http://localhost:5000/api'
if (!token || !miniAppUrl) throw new Error('Задайте TELEGRAM_BOT_TOKEN и MINI_APP_URL в переменных окружения.')

const telegram = async (method, body) => {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const result = await response.json(); if (!result.ok) throw new Error(result.description); return result.result
}
const send = (chatId, text, extra = {}) => telegram('sendMessage', { chat_id: chatId, text, ...extra })
let offset = 0

async function handle(update) {
  const message = update.message; if (!message?.text) return
  const chatId = message.chat.id; const userId = String(message.from.id); const text = message.text.trim()
  if (text === '/start') return send(chatId, 'Добро пожаловать в АгроСтат.\n\nВведите код хозяйства, например: РЕГ-001247')
  if (text.startsWith('/report')) return send(chatId, 'Откройте форму и заполните показатели.', { reply_markup: { inline_keyboard: [[{ text: 'Открыть отчётность', web_app: { url: miniAppUrl } }]] } })
  if (!text.match(/^РЕГ-\d{6}$/i)) return send(chatId, 'Введите код в формате РЕГ-001247 или используйте /report.')
  const response = await fetch(`${apiUrl}/telegram/identify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ farmCode: text, telegramUserId: userId }) })
  if (!response.ok) return send(chatId, 'Хозяйство не найдено. Проверьте код или обратитесь в службу статистики.')
  const farm = await response.json()
  return send(chatId, `Хозяйство «${farm.name}» успешно подтверждено.`, { reply_markup: { inline_keyboard: [[{ text: 'Заполнить отчёт', web_app: { url: miniAppUrl } }]] } })
}
async function poll() { while (true) { const updates = await telegram('getUpdates', { offset, timeout: 30 }); for (const update of updates) { offset = update.update_id + 1; await handle(update) } } }
poll().catch(error => { console.error(error); process.exit(1) })
