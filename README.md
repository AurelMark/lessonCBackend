# 🌍 LessonC Platform

---

## 🇷🇺 Русская версия

Добро пожаловать в **LessonC** — образовательную платформу, предназначенную для изучения иностранных языков.  
Платформа включает:
- 🎧 Аудио-материалы  
- 🎬 Видео-уроки  
- 🖼️ Изображения и карточки  
- 🧠 Интерактивные тесты и экзамены  

Проект разделён на две части:
1. **Backend** — серверная часть на Node.js (Express + TypeScript + MongoDB)
2. **Frontend** — клиентская часть на Next.js 15 (React + TypeScript)

---

# 🎓 lessonCBackend

Добро пожаловать в **lessonCBackend** — серверную часть образовательной платформы.  
Проект реализован на **Node.js + Express + TypeScript** и служит основой для хранения и обработки учебных материалов:

* 🎧 аудио-уроки  
* 🎮 видео-контент  
* 🖼️ изображения  
* 🧩 интерактивные тесты и экзамены  

Платформа поддерживает аутентификацию, управление ролями, работу с группами, тестами и рассылку писем через SMTP.

---

## ⚙️ Подготовка окружения

Создайте файл `.env` в корневой директории проекта и укажите параметры:

```env
PORT=              # Порт backend (например 5566)
NODE_ENV=          # development или production
MONGO_URL=         # MongoDB URI
JWT_SECRET=        # Секрет для токенов
JWT_EXPIRES_IN=    # Время жизни токена (например 1d)
HASH_SECRET=       # Секрет для хеширования
MAIL_USER=         # SMTP логин
MAIL_PASSWORD=     # SMTP пароль
MAIL_SUPER_ADMIN=  # Email администратора
```

> ⚠️ Файл `.env` не коммитится в репозиторий.

---

## 🚀 Запуск проекта

```bash
npm install
npm run dev
```

> 💡 Для `development` закомментируйте:
> ```ts
> import 'module-alias/register';
> ```

---

## 🏗️ Сборка

```bash
npm run build
```

> 💡 Перед сборкой раскомментируйте:
> ```ts
> import 'module-alias/register';
> ```

---

## 🇬🇧 English Version

Welcome to **LessonC** — a learning platform designed for studying foreign languages.  
It includes:
- 🎧 Audio materials  
- 🎬 Video lessons  
- 🖼️ Images and flashcards  
- 🧠 Interactive quizzes and exams  

The project consists of:
1. **Backend** — built with Node.js (Express + TypeScript + MongoDB)
2. **Frontend** — built with Next.js 15 (React + TypeScript)

---

# 🎓 lessonCBackend

Welcome to **lessonCBackend** — the server side of the educational platform.  
It is built with **Node.js + Express + TypeScript** and handles:

* 🎧 Audio lessons  
* 🎬 Video content  
* 🖼️ Images and illustrations  
* 🧩 Interactive exams  

The platform supports user authentication, roles (student, teacher, admin), group management, and email notifications via SMTP.

---

## ⚙️ Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
PORT=              # Port for backend (e.g., 5566)
NODE_ENV=          # development or production
MONGO_URL=         # MongoDB connection URI
JWT_SECRET=        # Secret for JWT token generation
JWT_EXPIRES_IN=    # Token lifetime (e.g., 1d)
HASH_SECRET=       # Secret for data hashing
MAIL_USER=         # SMTP email
MAIL_PASSWORD=     # SMTP password
MAIL_SUPER_ADMIN=  # Main admin email
```

> ⚠️ `.env` file is excluded from version control to protect sensitive data.

---

## 🚀 Run in Development Mode

```bash
npm install
npm run dev
```

> 💡 In `development`, comment out:
> ```ts
> import 'module-alias/register';
> ```

---

## 🏗️ Build for Production

```bash
npm run build
```

> 💡 Before building, uncomment:
> ```ts
> import 'module-alias/register';
> ```

---
