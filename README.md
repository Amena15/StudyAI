# 🌳 StudyAI

**An AI-powered, gamified spaced-repetition learning platform.**

StudyAI transforms any study material into interactive, AI-generated flashcards and quizzes. Built with a modern React Native frontend and a high-performance FastAPI backend, it leverages the Google Gemini API to create personalized learning experiences while keeping users motivated through gamification (growing trees, streaks, and progress tracking).

---

## ✨ Key Features

- 📄 **Multi-Format Uploads:** Process study materials via Text, PDF, Images (OCR), or YouTube video transcripts.
- 🧠 **AI-Powered Generation:** Automatically generates high-quality flashcards, multiple-choice, and open-ended questions tailored to the uploaded content.
- 🔄 **Spaced Repetition System (SRS):** Implements a proven algorithm (based on SuperMemo-2) to optimize long-term memory retention by scheduling reviews at optimal intervals.
- 🌳 **Gamification:** Grow a virtual tree, maintain daily study streaks, and track mastery levels to stay motivated.
- 🔒 **Secure Authentication:** JWT-based auth with bcrypt password hashing.
- 📊 **Analytics Dashboard:** Track total cards, mastered concepts, study time, and review history.
- 💎 **Subscription Tiers:** Built-in logic for Free vs. Premium upload limits.

---

## 🛠️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React Native, Expo, TypeScript, React Navigation |
| **Backend** | Python 3.13, FastAPI, Uvicorn, Pydantic |
| **Database** | MongoDB (via `motor` async driver) |
| **AI & ML** | Google Gemini API (`google-genai`) |
| **Utilities** | PyPDF2, `youtube-transcript-api`, OCR.space, `bcrypt`, `python-jose` |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+ and `pip`
- Node.js 18+ and `npm` (or `yarn`/`bun`)
- MongoDB instance (local or Atlas)
- [Google AI Studio API Key](https://aistudio.google.com/app/apikey)

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file (see Environment Variables below)
cp .env.example .env

# Start the development server
uvicorn server:app --reload --host 0.0.0.0 --port 8000