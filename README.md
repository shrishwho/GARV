# 🚨 GARV — Women Safety & Emergency Response System

GARV is a full-stack women safety web application designed to provide quick access to emergency assistance through **manual SOS**, **AI-based hand gesture detection**, **GPS location tracking**, **trusted emergency contacts**, **SOS history**, and **safety analytics**.

The system combines a modern React frontend, Node.js/Express backend, MongoDB database, and MediaPipe AI hand-gesture detection.

---

## 🌐 Live Demo

🔗 **Live Website:**  
https://garv-six.vercel.app

🔗 **GitHub Repository:**  
https://github.com/shrishwho/GARV

---

## ✨ Features

### 🔐 User Authentication
- User registration
- User login
- User logout
- Invalid login validation
- User-specific data handling

### 👥 Trusted Emergency Contacts
Users can:
- Add trusted contacts
- View saved contacts
- Delete contacts
- Use multiple emergency contacts for SOS

### 🚨 Manual SOS
The user can manually trigger an SOS emergency alert.

When SOS is activated:
1. The application requests the user's location.
2. GPS coordinates are captured.
3. A Google Maps location link is generated.
4. The SOS information is sent to the backend.
5. The SOS event is stored in MongoDB.
6. The emergency location can be opened in Google Maps.

### 🤖 AI Hand Gesture SOS

GARV includes AI-powered emergency gesture detection using **MediaPipe Hand Landmarker**.

The emergency flow is:

```text
Camera
   ↓
AI Hand Detection
   ↓
Closed Fist ✊ Detected
   ↓
3 Second Countdown
   ↓
Automatic SOS
   ↓
GPS Location
   ↓
MongoDB SOS History
