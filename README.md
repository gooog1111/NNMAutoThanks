# NNM AutoThanks - автоматическое благодарение на форуме NNMClub

Расширение для браузера Google Chrome, которое автоматически нажимает кнопки **"Спасибо"** на форуме [NNMClub.to](https://nnmclub.to). Поддерживает два режима работы: автоматический перебор тем через трекер и фоновое нажатие кнопок при обычном просмотре.

## Функционал
✅ **Автоматический режим**  
   - Перебирает все темы в трекере (`tracker.php`) и нажимает кнопки "Спасибо"  
   - Поддержка пагинации (переход по страницам трекера)  

✅ **Фоновый режим**  
   - Автоматически нажимает кнопки "Спасибо" при открытии темы вручную (`viewtopic.php`)  

✅ **Визуальная индикация**  
   - Нажатые кнопки становятся полупрозрачными и черно-белыми  

✅ **Гибкие настройки**  
   - Включение/отключение авторежима через popup  

## Установка
### 1. Запакованное расширение в .crx
📌 В блоке [Релиз](https://github.com/gooog1111/NNMAutoThanks/releases)  

### 2. Вручную (для разработчиков)
1. Скачайте архив с расширением (`NNMAutoThanks-main.zip`)  
2. Распакуйте в удобную папку  
3. Перейдите в `chrome://extensions/`  
4. Включите **"Режим разработчика"** (правый верхний угол)  
5. Нажмите **"Загрузить распакованное расширение"** и выберите папку  

## Как пользоваться?
1. Откройте трекер NNMClub (`tracker.php`) или любую тему (`viewtopic.php`)  
2. Нажмите на иконку расширения в панели Chrome  
3. Выберите режим:  
   - **Старт** - автоматический перебор тем  
   - **Стоп** - остановка  
   - **Авто-благодарение** - фоновое нажатие кнопок при просмотре  

## Технические детали
- **Тип**: Browser Extension (Chrome, Edge, Opera)  
- **Версия**: 0.1.3  
- **Языки**: JavaScript, HTML, CSS  
- **Разрешения**:  
  - Доступ к `nnmclub.to/forum/*`  
  - Управление вкладками (`tabs`)  

## Возможные проблемы и решения
| Ошибка | Причина | Решение |
|--------|---------|---------|
| `Не работает на трекере` | Не открыта страница `tracker.php` | Перейдите на `tracker.php` и нажмите **"Старт"** |
| `Кнопки не нажимаются` | Нет подходящих кнопок | Проверьте, есть ли кнопки "Спасибо" в теме |
| `Расширение не отвечает` | Chrome заблокировал скрипт | Перезагрузите страницу и попробуйте снова |

## Разработка и доработки
🔧 **Как собрать расширение?**  
1. Клонируйте репозиторий  
2. Запустите в режиме разработки (`chrome://extensions/` → "Загрузить распакованное")  

📌 **Планы на будущее**  
- Добавить настройку задержки между нажатиями  
- Поддержка других форумов (по запросу)  

## Автор и лицензия
👤 **Автор**: [gooog1111](https://github.com/gooog1111) 
📜 **Лицензия**: MIT (открытое ПО)  
🐛 **Сообщить о баге**: [GitHub Issues]() 

🚀 **Спасибо за использование!**
