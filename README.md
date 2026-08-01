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
```
*📖 API Documentation is automatically available at: `http://localhost:8000/docs`*

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd ../frontend

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```
*Scan the QR code with the Expo Go app on your physical device, or press `i` to open the iOS Simulator.*

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=studyai_db

# Security
JWT_SECRET_KEY=your-super-secret-jwt-key-here

# AI & External APIs
GEMINI_API_KEY=AIzaSy... (Get from Google AI Studio)
OCR_API_KEY=your-ocr-space-api-key
```
> ⚠️ **Security Note:** Never commit your `.env` file to version control. It is already ignored by `.gitignore`.

---

## 🏗️ System Architecture

1. **Ingestion:** User uploads a file/link via the React Native app.
2. **Extraction:** FastAPI extracts raw text using `PyPDF2`, `youtube-transcript-api`, or OCR.
3. **Generation:** The extracted text is sent to the Google Gemini API with a strict JSON-enforcing prompt.
4. **Storage:** Validated questions are saved to MongoDB alongside the user's ID and initial SRS parameters (`interval=1`, `ease_factor=2.5`).
5. **Review:** The frontend fetches cards where `next_review_date <= now`. User ratings (`again`, `hard`, `good`, `easy`) trigger the SRS algorithm to calculate the next review date and update the user's tree/streak.

---

## 🗺️ Future Roadmap

- [ ] Integration with RevenueCat for real App Store subscriptions.
- [ ] Text-to-Speech (TTS) for audio-based flashcard reviews.
- [ ] Collaborative study groups and shared decks.
- [ ] Export flashcards to Anki format (.apkg).

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by Amena**  
[GitHub](https://github.com/Amena15) • [LinkedIn](#)
```
