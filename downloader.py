"""
Video Downloader Module
Модуль для скачивания видео с различных платформ используя yt-dlp
"""

import os
import asyncio
import logging
from pathlib import Path
import yt_dlp

logger = logging.getLogger(__name__)

class VideoDownloader:
    """Класс для скачивания видео"""
    
    def __init__(self, download_dir: str = "/tmp/fredo_downloads"):
        """
        Инициализация загрузчика
        
        Args:
            download_dir: Директория для временных файлов
        """
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(parents=True, exist_ok=True)
        
        # Настройки yt-dlp
        self.ydl_opts = {
            'format': 'best[ext=mp4]/best',  # Лучшее качество в MP4
            'outtmpl': str(self.download_dir / '%(id)s.%(ext)s'),
            'quiet': False,
            'no_warnings': False,
            'extract_flat': False,
            'nocheckcertificate': True,
            'ignoreerrors': False,
            'no_color': True,
            'cookiefile': None,
            
            # Ограничения размера файла (макс 2GB для Telegram)
            'max_filesize': 2147483648,  # 2GB в байтах
            
            # Дополнительные опции для стабильности
            'retries': 3,
            'fragment_retries': 3,
            'skip_unavailable_fragments': True,
            
            # Метаданные
            'writethumbnail': False,
            'writesubtitles': False,
            'writeautomaticsub': False,
        }
    
    async def download_video(self, url: str) -> str | None:
        """
        Скачивание видео по URL
        
        Args:
            url: URL видео для скачивания
            
        Returns:
            Путь к скачанному файлу или None при ошибке
        """
        try:
            logger.info(f"Начало скачивания: {url}")
            
            # Запуск yt-dlp в отдельном потоке (не блокирует async)
            loop = asyncio.get_event_loop()
            video_path = await loop.run_in_executor(
                None,
                self._download_sync,
                url
            )
            
            if video_path and os.path.exists(video_path):
                file_size = os.path.getsize(video_path) / (1024 * 1024)  # MB
                logger.info(f"Видео скачано: {video_path} ({file_size:.2f} MB)")
                return video_path
            else:
                logger.error(f"Файл не найден после скачивания: {url}")
                return None
                
        except Exception as e:
            logger.error(f"Ошибка при скачивании {url}: {e}")
            return None
    
    def _download_sync(self, url: str) -> str | None:
        """
        Синхронное скачивание видео (для executor)
        
        Args:
            url: URL видео
            
        Returns:
            Путь к файлу или None
        """
        try:
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                # Получение информации о видео
                info = ydl.extract_info(url, download=True)
                
                if info:
                    # Формирование пути к скачанному файлу
                    video_id = info.get('id', 'video')
                    ext = info.get('ext', 'mp4')
                    video_path = str(self.download_dir / f"{video_id}.{ext}")
                    
                    return video_path
                    
        except yt_dlp.utils.DownloadError as e:
            logger.error(f"yt-dlp DownloadError: {e}")
            return None
        except Exception as e:
            logger.error(f"Неожиданная ошибка при скачивании: {e}")
            return None
    
    async def get_video_info(self, url: str) -> dict | None:
        """
        Получение информации о видео без скачивания
        
        Args:
            url: URL видео
            
        Returns:
            Словарь с информацией о видео или None
        """
        try:
            ydl_opts = self.ydl_opts.copy()
            ydl_opts['skip_download'] = True
            
            loop = asyncio.get_event_loop()
            info = await loop.run_in_executor(
                None,
                self._get_info_sync,
                url,
                ydl_opts
            )
            
            return info
            
        except Exception as e:
            logger.error(f"Ошибка получения информации: {e}")
            return None
    
    def _get_info_sync(self, url: str, opts: dict) -> dict | None:
        """Синхронное получение информации"""
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
                return info
        except Exception as e:
            logger.error(f"Ошибка extract_info: {e}")
            return None
    
    async def cleanup(self, file_path: str) -> bool:
        """
        Удаление временного файла
        
        Args:
            file_path: Путь к файлу для удаления
            
        Returns:
            True если успешно удалено
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Файл удален: {file_path}")
                return True
            return False
        except Exception as e:
            logger.error(f"Ошибка при удалении файла {file_path}: {e}")
            return False
    
    async def cleanup_old_files(self, max_age_hours: int = 1):
        """
        Очистка старых файлов в директории загрузок
        
        Args:
            max_age_hours: Максимальный возраст файлов в часах
        """
        try:
            import time
            current_time = time.time()
            max_age_seconds = max_age_hours * 3600
            
            for file_path in self.download_dir.glob("*"):
                if file_path.is_file():
                    file_age = current_time - file_path.stat().st_mtime
                    if file_age > max_age_seconds:
                        os.remove(file_path)
                        logger.info(f"Удален старый файл: {file_path}")
                        
        except Exception as e:
            logger.error(f"Ошибка при очистке старых файлов: {e}")
