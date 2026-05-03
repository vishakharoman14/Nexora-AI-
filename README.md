# Nexora AI 🤖

A next-generation AI chat assistant built with React and powered by Groq's Llama 3.3 70B model. Designed to feel like ChatGPT — fast, clean, and fully functional.


## ✨ Features

- 💬 **Real-time AI responses** powered by Groq API
- 🗂️ **Chat history** — multiple conversations with sidebar navigation
- 📝 **Markdown rendering** — formatted responses with headings, lists, bold text
- 🖥️ **Syntax highlighting** — code blocks with language detection and copy button
- 📱 **Mobile responsive** — collapsible sidebar works on all screen sizes
- 🗑️ **Delete chats** — manage your conversation history
- ⚡ **Blazing fast** — Groq's inference is the fastest available

## 🛠️ Tech Stack

- **React** — UI framework
- **Vite** — build tool with HMR
- **Groq API** — AI inference (free tier)
- **Llama 3.3 70B** — language model
- **React Markdown** — markdown rendering
- **React Syntax Highlighter** — code highlighting

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/vishakharoman14/Nexora-AI-
cd Nexora-AI-
```

### 2. Install dependencies
```bash
npm install
```

### 3. Add your Groq API key
Create a `.env` file in the root:

VITE_GROQ_API_KEY=gsk_your_key_here

Get a free API key at [console.groq.com](https://console.groq.com)

### 4. Run the app
```bash
npm run dev
```

## 🌐 Live Demo

[https://nexora-ai-ecru.vercel.app](https://nexora-ai-ecru.vercel.app)

## 📁 Project Structure
src/
├── App.jsx          # Main chat component
├── constants.js     # API config
└── main.jsx         # Entry point
public/
└── nexora-logo.png  # App logo

## 🔒 Environment Variables

| Variable | Description |
|---|---|
| `VITE_GROQ_API_KEY` | Your Groq API key |

## 👩‍💻 Built By

**Vishakha Roman** — [GitHub](https://github.com/vishakharoman14)

---

> Developed for learning purposes · Powered by Groq · Llama 3.3 70B
