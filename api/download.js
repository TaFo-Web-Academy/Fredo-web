module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only POST
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

    // Проверка платформы
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
        message: 'Платформа не поддерживается'
      });
    }

    // Отправка к боту (используем динамический import для fetch в Node.js)
    const botUrl = 'https://nursing-julieta-freedownloadvideobot-970ab5d7.koyeb.app/webhook';
    
    const response = await fetch(botUrl, {
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

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message: 'Видео обрабатывается! Проверь Telegram бот.',
        task_id: data.task_id
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Ошибка при отправке к боту'
      });
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Внутренняя ошибка: ${error.message}`
    });
  }
};
