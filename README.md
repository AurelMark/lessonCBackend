# lessonCampBackend

Backend for the LessonCamp project.

---

## ⚙️ Установка и запуск

1. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/AurelMark/lessonCampBackend.git
   cd lessonCampBackend
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```

3. **Создайте файл `.env` в корне проекта и укажите в нем ваши параметры:**

   Пример содержимого файла `.env`:

   ```env
   # Порт для запуска сервера
   PORT=1111              # <Ваш порт, например 1111>

   # Окружение (development/production)
   NODE_ENV=development

   # Строка подключения к MongoDB
   MONGO_URL=mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority&appName=<appName>
   appName=ClusterName

   # JWT настройки
   JWT_SECRET='' # <Ваш секрет>
   JWT_EXPIRES_IN='30d'

   # Секрет для хеширования
   HASH_SECRET='' # <Ваш хеш-секрет>

   # SMTP-почта (для отправки писем)
   MAIL_USER=your.email@gmail.com
   MAIL_PASSWORD=<пароль_приложения_Gmail>
   MAIL_SUPER_ADMIN=admin.email@gmail.com
   ```

   > **Примечание:**  
   > - Вместо `<username>`, `<password>`, `<cluster-url>`, `<dbname>`, `<appName>` и `<пароль_приложения_Gmail>` укажите ваши реальные значения.
   > - Все секреты должны храниться только локально, не выкладывайте файл `.env` в публичный доступ!

4. **Запустите проект:**
   ```bash
   npm start
   ```
   или, если используете nodemon для разработки:
   ```bash
   npm run dev
   ```

---

## 🛡️ Безопасность

- Всегда используйте переменные окружения для всех паролей и секретов!
- Не коммитьте `.env` в git!
- Если секрет попал в репозиторий — СМЕНИТЕ ЕГО немедленно.

---

## 📬 Почта

Для работы с Gmail используйте [пароль приложения Google](https://myaccount.google.com/apppasswords).  
Рекомендуется включить двухэтапную аутентификацию.

---

Если возникнут вопросы — создавайте issue или пишите в [контакты](mailto:phonetics.md@gmail.com).
