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

# 🎓 lessonCFrontend

Добро пожаловать в **lessonCFrontend** — клиентскую часть платформы **LessonC**, построенную на **Next.js 15 + TypeScript + Tailwind CSS**.

Пользователь может:
* 🎧 проходить аудио-уроки  
* 🎬 смотреть видео  
* 🖼️ изучать изображения  
* 🧩 проходить тесты  
* 🧑‍🏫 взаимодействовать с преподавателями  

---

## ⚙️ Настройка окружения

Создайте `.env` в корне проекта:

```env
NEXT_PUBLIC_BACKEND_URL=   # URL backend API
NEXT_HASH_SECRET=          # Секрет для хеширования (тот же, что и в backend)
JWT_SECRET=                # Секрет для токенов (тот же, что и в backend)
```

> ⚠️ Все значения должны соответствовать настройкам backend.

---

## 🚀 Запуск разработки

```bash
npm install
npm run dev
```

Откройте: [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Сборка production

```bash
npm run build
npm start
```

---

## 🧩 Технологии

* Next.js 15 (App Router, SSR)  
* React 18 + TypeScript  
* Tailwind CSS  
* Shadcn/UI  
* TanStack Query  
* Zod  
* Axios  
* dotenv  

---

## 💡 Примечание

Связь frontend ↔ backend:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5566
```

---

## 🧠 Автор

Разработчик: [Aurel Mark](https://github.com/AurelMark)

---

## 📄 Лицензия

Проект предназначен для образовательных целей.

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

# 🎓 lessonCFrontend

Welcome to **lessonCFrontend** — the client side of **LessonC**, built with **Next.js 15 + TypeScript + Tailwind CSS**.  
It provides an interactive user interface for students, teachers, and administrators.

Users can:
* 🎧 Listen to audio lessons  
* 🎬 Watch videos  
* 🖼️ Study visual materials  
* 🧩 Take interactive quizzes  
* 🧑‍🏫 Communicate with teachers  

---

## ⚙️ Environment Setup

Create a `.env` file in the root folder:

```env
NEXT_PUBLIC_BACKEND_URL=   # URL of backend API
NEXT_HASH_SECRET=          # Secret for file hashing (must match backend)
JWT_SECRET=                # Secret for tokens (must match backend)
```

> ⚠️ All values must correspond to the backend configuration.

---

## 🚀 Run in Development Mode

```bash
npm install
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Build and Start for Production

```bash
npm run build
npm start
```

---

## 🧩 Tech Stack

* Next.js 15 (App Router, SSR)  
* React 18 + TypeScript  
* Tailwind CSS  
* Shadcn/UI  
* TanStack Query  
* Zod  
* Axios  
* dotenv  

---

## 💡 Developer Notes

Frontend ↔ Backend connection:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5566
```

---

## 🧠 Author

Developer: [Aurel Mark](https://github.com/AurelMark)

---

## 📄 License

This project is open for educational purposes only.  
All API and design rights reserved by the repository owner.
