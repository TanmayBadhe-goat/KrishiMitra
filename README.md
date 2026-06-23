# 🌾 KrishiMitra - AI Crop Advisor System

**Empowering Indian Farmers with AI**  
Built for the **Smart India Hackathon (SIH) 2025** 🇮🇳

KrishiMitra is a comprehensive, full-stack AI-driven agricultural advisory platform designed to help farmers make data-driven decisions. By analyzing soil and environmental parameters, it provides highly accurate crop recommendations, disease detection, and an intelligent farming assistant chatbot.

---

## 🌟 Key Features

- **🎯 AI Crop Prediction:** Uses a Random Forest Machine Learning model to recommend the best crop out of 31 supported crops based on 7 vital parameters (N, P, K, Temperature, Humidity, pH, Rainfall).
- **🤖 Intelligent Chatbot:** Powered by Google's Gemini API, providing localized farming advice, disease treatment suggestions, and agricultural knowledge.
- **🦠 Plant Disease Detection:** Allows users to upload leaf images to identify diseases and receive actionable treatment and prevention plans.
- **📱 Multi-Platform Access:** Available as a responsive Web Application and a cross-platform Mobile App (React Native/Expo).
- **📡 IoT Integration (ESP32):** Hardware integration capabilities for real-time soil and weather data collection.

---

## 🏗️ Project Architecture & Tech Stack

The project is divided into four main components:

### 1. 🐍 Backend & Machine Learning (`/` and `/backend`)
A robust RESTful API built with Python and Flask, serving the ML models and generative AI chatbot.
- **Framework:** Flask, Flask-CORS
- **Machine Learning:** scikit-learn, numpy
- **Generative AI:** Google Generative AI (Gemini `gemini-1.5-flash`, `gemini-pro`)
- **Key Files:** 
  - `app.py`: Main Flask application handling API routes.
  - `train_model.py` / `quick_train.py`: Scripts to train the Random Forest crop prediction model.
  - `crops_dataset.py`: Comprehensive dataset for 31 Indian crops.
  - `ML_MODEL_README.md`: Detailed documentation on the ML model.

### 2. 💻 Frontend Web Application (`/frontend`)
A modern, responsive web dashboard for farmers and agricultural experts.
- **Framework:** React 18, Vite
- **Language:** TypeScript
- **Styling & UI:** Tailwind CSS, shadcn/ui, Radix UI, Framer Motion (Tailwind-animate)
- **Data Fetching:** TanStack React Query, Axios
- **Routing:** React Router DOM

### 3. 📱 Mobile Application (`/mobile-app`)
A cross-platform mobile app ensuring accessibility for farmers on the go.
- **Framework:** React Native, Expo
- **Language:** TypeScript
- **Navigation:** React Navigation (Bottom Tabs, Native Stack)
- **UI Components:** React Native Paper, Lucide Icons

### 4. 📟 IoT Hardware (`/iot`)
Embedded systems code for real-time sensor data gathering.
- **Microcontroller:** ESP32
- **Language:** C++ / Arduino (`krishimitra_esp32.ino`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- Expo CLI (for Mobile App)
- Gemini API Key (for Chatbot features)

### 1️⃣ Setting up the Backend & ML
```bash
# Navigate to project root
cd ai-crop-advisor

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Train the ML model (Required for first run)
python quick_train.py

# Set your Gemini API key as an environment variable
set Gemini_API_key=YOUR_API_KEY  # Windows

# Run the Flask server
python app.py
```
*The backend API will start at `http://localhost:5000`.*

### 2️⃣ Setting up the Frontend Web App
```bash
# Open a new terminal and navigate to frontend
cd ai-crop-advisor/frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
*The web app will be available at `http://localhost:5173`.*

### 3️⃣ Setting up the Mobile App
```bash
# Open a new terminal and navigate to mobile-app
cd ai-crop-advisor/mobile-app

# Install dependencies
npm install

# Start the Expo development server
npm start
```
*Use the Expo Go app on your phone to scan the QR code, or run on an emulator.*

---

## 📂 Project Structure Overview

```text
ai-crop-advisor/
│
├── app.py                   # Main Flask API Server
├── crops_dataset.py         # Agricultural knowledge & dataset
├── train_model.py           # ML Model training script
├── requirements.txt         # Python dependencies
├── ML_MODEL_README.md       # Docs specific to ML architecture
│
├── backend/                 # Backend data and saved models
│   └── data/                # Contains model.pkl and scaler.pkl
│
├── frontend/                # React + Vite Web Application
│   ├── src/                 # React components, pages, and hooks
│   ├── package.json         # Node dependencies
│   └── tailwind.config.ts   # Tailwind configuration
│
├── mobile-app/              # React Native + Expo Mobile Application
│   ├── src/                 # Screens and mobile components
│   └── package.json         # React Native dependencies
│
└── iot/                     # ESP32 Microcontroller Code
    └── krishimitra_esp32.ino # Arduino script for sensors
```

---

## 🏆 Hackathon Demo Instructions (SIH 2025)

1. **Ensure the ML model is trained** by running `python quick_train.py`.
2. **Verify the backend** is running and the Gemini API key is properly configured.
3. Show the **Web Dashboard** predicting crops accurately based on N, P, K, and Weather inputs.
4. Demonstrate the **Chatbot's** ability to answer localized farming queries.
5. Showcase the **Mobile App** interface for farmer accessibility.

---

*Built with ❤️ for Indian Agriculture.*
