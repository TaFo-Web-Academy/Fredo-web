from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.error
import re

# Конфигурация
BOT_API_URL = "https://nursing-julieta-freedownloadvideobot-970ab5d7.koyeb.app/webhook"
BACKEND_SECRET = "fredo_secret_key_2025"

# Поддерживаемые платформы
SUPPORTED_PLATFORMS = [
    r"youtube\.com|youtu\.be",
    r"instagram\.com",
    r"tiktok\.com",
    r"twitter\.com|x\.com",
    r"facebook\.com|fb\.watch",
    r"reddit\.com",
    r"pinterest\.com",
    r"vimeo\.com",
    r"twitch\.tv",
    r"dailymotion\.com",
    r"vk\.com",
    r"t\.me"
]

def is_supported_platform(url):
    """Проверка поддержки платформы"""
    for pattern in SUPPORTED_PLATFORMS:
        if re.search(pattern, url, re.IGNORECASE):
            return True
    return False

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Обработка POST запросов"""
        try:
            # CORS headers
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            # Чтение данных
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            url = data.get('url')
            user_id = data.get('user_id')
            
            if not url or not user_id:
                response = {
                    "success": False,
                    "message": "Отсутствует URL или user_id"
                }
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Проверка платформы
            if not is_supported_platform(url):
                response = {
                    "success": False,
                    "message": "Платформа не поддерживается"
                }
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Отправка к боту
            bot_data = json.dumps({
                "url": url,
                "user_id": user_id,
                "secret": BACKEND_SECRET
            }).encode('utf-8')
            
            req = urllib.request.Request(
                BOT_API_URL,
                data=bot_data,
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(req, timeout=30) as bot_response:
                bot_result = json.loads(bot_response.read().decode())
                
                response = {
                    "success": True,
                    "message": "Видео обрабатывается! Проверь Telegram бот.",
                    "task_id": bot_result.get("task_id")
                }
                self.wfile.write(json.dumps(response).encode())
                
        except Exception as e:
            response = {
                "success": False,
                "message": f"Ошибка: {str(e)}"
            }
            self.wfile.write(json.dumps(response).encode())
    
    def do_OPTIONS(self):
        """CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
