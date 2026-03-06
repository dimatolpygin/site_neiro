# TODO — site_neiro

## Новые типы генерации

### Страницы
- [x] Страница редактирования фото (`/generate/edit`) — URL + prompt
- [ ] Страница генерации видео из картинки (`/generate/image-to-video`)
- [ ] Страница говорящего аватара (`/generate/avatar`)
- [ ] Страница озвучки текста (`/generate/tts`)

### Worker (BullMQ)
- [x] Обработка типа `edit` (редактирование фото)
- [ ] Обработка типа `image-to-video`
- [ ] Обработка типа `avatar`
- [ ] Обработка типа `tts`

### Модели в UI и Worker
- [x] `google/nano-banana-2/edit` — редактирование фото
- [x] `google/nano-banana-pro/edit` — редактирование фото
- [ ] `wavespeed-ai/qwen-image-2.0-pro/text-to-image` — генерация по русскому промпту
- [ ] `alibaba/wan-2.6/text-to-video` — видео из текста со звуком
- [ ] `google/veo3.1-fast/image-to-video` — видео из картинки
- [ ] `kwaivgi/kling-v3.0-std/motion-control` — премиум видео
- [ ] `wavespeed-ai/skyreels-v3/talking-avatar` — говорящий аватар
- [ ] `google/gemini-2.5-pro/text-to-speech` — озвучка текста (TTS)
