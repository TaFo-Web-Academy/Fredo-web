async def process_video_url(user_id: int, url: str, message: Message = None):
    """Обработка URL и отправка видео пользователю"""
    try:
        # Отправка уведомления о начале загрузки
        if message:
            status_msg = await message.answer("⏳ Обрабатываю запрос...")
        else:
            status_msg = await bot.send_message(
                user_id,
                "⏳ Начинаю скачивание видео..."
            )
        
        # Проверка - это прямая ссылка или нужно скачивать через yt-dlp
        if url.endswith(('.mp4', '.mkv', '.avi', '.mov')) or 'cdn' in url or 'stream' in url:
            # Прямая ссылка - отправляем как есть
            logger.info(f"Прямая ссылка на видео: {url}")
            await status_msg.edit_text("📤 Отправляю видео...")
            
            await bot.send_video(
                chat_id=user_id,
                video=url,
                caption="✅ Видео готово! Скачано через FREDO 🎉",
                supports_streaming=True
            )
            
            await status_msg.delete()
            
        else:
            # Обычное скачивание через yt-dlp
            logger.info(f"Начало скачивания через yt-dlp: {url} для пользователя {user_id}")
            video_path = await downloader.download_video(url)
            
            if not video_path:
                await status_msg.edit_text(
                    "❌ Не удалось скачать видео.\n"
                    "Возможно, ссылка недоступна или платформа не поддерживается."
                )
                return
            
            await status_msg.edit_text("📤 Отправляю видео...")
            
            with open(video_path, 'rb') as video_file:
                await bot.send_video(
                    chat_id=user_id,
                    video=video_file,
                    caption="✅ Видео готово! Скачано через FREDO 🎉",
                    supports_streaming=True
                )
            
            await status_msg.delete()
            await downloader.cleanup(video_path)
        
        logger.info(f"Видео успешно отправлено пользователю {user_id}")
        
    except Exception as e:
        logger.error(f"Ошибка при обработке видео: {e}")
        error_msg = "❌ Произошла ошибка при обработке видео.\n"
        error_msg += "Попробуй другую ссылку или попробуй позже."
        
        if message:
            await message.answer(error_msg)
        else:
            await bot.send_message(user_id, error_msg)
