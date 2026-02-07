module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { url, user_id } = req.body;

    if (!url || !user_id) {
      return res.status(400).json({
        success: false,
        message: 'Отсутствует URL или user_id'
      });
    }

    // Просто отправляем URL боту напрямую
    // Бот сам попробует скачать
    const botUrl = 'https://nursing-julieta-freedownloadvideobot-970ab5d7.koyeb.app/webhook';
    
    const botResponse = await fetch(botUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        user_id: user_id,
        secret: 'fredo_secret_key_2025'
      })
    });

    if (!botResponse.ok) {
      throw new Error(`Bot responded with ${botResponse.status}`);
    }

    const botData = await botResponse.json();

    return res.status(200).json({
      success: true,
      message: 'Видео обрабатывается! Проверь Telegram бот.',
      task_id: botData.task_id || 'processing'
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: `Ошибка: ${error.message}`
    });
  }
};
