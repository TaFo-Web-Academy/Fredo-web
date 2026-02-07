module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Get request body
    const { url, user_id } = req.body;

    // Validate input
    if (!url || !user_id) {
      return res.status(400).json({
        success: false,
        message: 'Отсутствует URL или user_id'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Неверный формат URL'
      });
    }

    // Supported platforms check
    const supportedPlatforms = [
      /youtube\.com|youtu\.be/i,
      /instagram\.com/i,
      /tiktok\.com/i,
      /twitter\.com|x\.com/i,
      /facebook\.com|fb\.watch/i,
      /reddit\.com/i,
      /pinterest\.com/i,
      /vimeo\.com/i,
      /twitch\.tv/i,
      /dailymotion\.com/i,
      /vk\.com/i,
      /t\.me/i
    ];

    const isSupported = supportedPlatforms.some(pattern => pattern.test(url));

    if (!isSupported) {
      return res.status(400).json({
        success: false,
        message: 'Платформа не поддерживается. Проверь список поддерживаемых платформ.'
      });
    }

    // Send to bot webhook
    const BOT_WEBHOOK_URL = 'https://nursing-julieta-freedownloadvideobot-970ab5d7.koyeb.app/webhook';
    const BACKEND_SECRET = 'fredo_secret_key_2025';

    const botResponse = await fetch(BOT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        user_id: user_id,
        secret: BACKEND_SECRET
      })
    });

    // Check bot response
    if (!botResponse.ok) {
      console.error('Bot response error:', botResponse.status, botResponse.statusText);
      return res.status(500).json({
        success: false,
        message: 'Ошибка при отправке задачи боту'
      });
    }

    const botData = await botResponse.json();

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Видео обрабатывается! Проверь Telegram бот.',
      task_id: botData.task_id || `task_${Date.now()}`
    });

  } catch (error) {
    // Log error for debugging
    console.error('API Error:', error.message);
    
    // Return error response
    return res.status(500).json({
      success: false,
      message: `Внутренняя ошибка сервера: ${error.message}`
    });
  }
};
