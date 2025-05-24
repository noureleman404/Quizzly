# 🧠 AI Quiz Generator & Proctoring System

A modular platform that:
- Enables teachers to create classrooms and assign quizzes
- Loads and chunks PDF books (1 page = 1 chunk)
- Generates quizzes from selected page ranges using LLMs
- Evaluates short answer responses with contextual understanding
- Detects potential cheating using face detection (MediaPipe)

---

## 📦 Features

- 📘 **PDF Book Ingestion**: Store and chunk books page-wise in PostgreSQL  
- 🏫 **Classroom Management**: Teachers create classrooms, students join with codes  
- 🧪 **Quiz Assignment**: Teachers assign quizzes to specific classrooms  
- ✍️ **AI Quiz Generation**: MCQs and short-answer questions via LLMs  
- 🧠 **LLM-Based Evaluation**: Uses generation context + semantic search (ChromaDB)  
- 🎥 **Cheat Detection**: Detects multiple/no faces or head turn during quizzes  
- ⚙️ **Dual Setup**: Supports Dockerized and local environments  
---

## 🚀 Quick Start

### 🔁 Clone & Setup

```bash
git clone https://github.com/noureleman404/Quizzly
cd quizzly
cp .env
```

### 🐳 Option 1: Run with Docker (not available yet)

```bash
docker-compose up --build
```

### 🛠️ Option 2: Local Setup

Install dependencies:

```bash
# FastAPI service
cd server
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
cd ai
python setup_db.py  
cp ../../.env.example .env


# NodeJs service
cd server/nodejs
npm install
cp ../../.env.example .env
```

Run servers:

```bash
# Run FastAPI service
cd server
source venv/bin/activate
cd ai 
fastapi dev

# Run NodeJs service
cd server/nodejs
npm start

# Run frontend
cd client
npx serve . 
```

---

## 📘 Usage Guide

1. Sign up as a **teacher** via the dashboard
2. Create a **classroom** and share the code with students
3. Upload a **PDF book** to be used for quiz generation
4. Select a page range and **generate a test** for the classroom
5. Sign up as a **student**
6. Join the classroom using the shared code
7. Take the assigned **quiz/test**
8. System monitors via webcam and evaluates answers using LLMs
9. Receive feedback and score
---

## 🧠 Evaluation Logic
- Context used in generation is retained  
- Semantic retrieval (via ChromaDB) finds similar passages  
- **MCQs:** Correct answers are pre-generated and used for automatic scoring  
- **Short Answer Questions:** Answers are evaluated by the LLM using the provided context and retrieved similar passages  
- Fail-safe validation for blank or irrelevant answers  

---

## 🎥 Proctoring Detection Logic

| Event              | Action                                  |
|-------------------|------------------------------------------|
| No face detected  | Warn user and pause timer                |
| Multiple faces    | Log incident, alert user                 |
| Looking away      | Log incident after threshold timeout     |

---

## 🧪 Tech Stack

- **Backend**: FastAPI, PostgreSQL, ChromaDB, LangChain, Node.js, PyTorch, Hugging Face Transformers  
- **Frontend**: HTML, JavaScript, MediaPipe  
- **LLM**: Hugging Face (configurable) / Gemini-Flash-1.5  
- **Containerization**: Docker, Docker Compose  
---

## 📂 Directory Structure

```
.
├── server/
│   ├── nodejs/
│   │   └── database/
│   │   └── middlewares/
│   │   └── routes/
│   │   └── app.js
│   │   └── server.js
│   │   └── package.json
│   │   └── package-lock.json
│   │   └── .env
│   ├── ai/
│   │   └── chromaDB/
│   │   └── utilities/
│   │   └── vectorStore/
│   │   └── workflow/
│   │   └── .env
│   │   └── api.py
├── client/
│   ├── index.html
│   └── assets/
│   └── CSS/
│   └── JS/
├── docs/
│   ├── api.md
│   ├── architecture.md
│   ├── cheat_detection.md
│   ├── evaluation.md
│   ├── overview.md
│   ├── quiz_generation.md
│   ├── setup.md
│   └── evaluation.md
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## 🙌 Contributing

Pull requests are welcome!  
Please see [`docs/contributors_guide.md`](./docs/contributors_guide.md) for guidelines.

---

## 📬 Contact

Maintained by [Mohamed Sherif](mailto:mohamed.ms5517@gmail.com)  , [Nour E. Mostafa](mailto:https://www.linkedin.com/in/nour-e-mostafa-49a290216/) 
