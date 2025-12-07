# ARdent Study – AR Powered Contextual Learning Companion

ARdent Study is an AR-powered contextual learning platform designed to transform traditional studying by integrating Augmented Reality, Computer Vision, Natural Language Processing, and Graph-based intelligence. The system scans textbooks or handwritten notes, extracts key concepts using OCR and NLP, and instantly enhances them with multimedia resources such as 3D models, animations, explanations, videos, flashcards, quizzes, and collaborative knowledge graphs.

This repository contains the complete full-stack implementation of my Final Year Project, including frontend interfaces, backend APIs, AI modules, database design, AR components, and system logic.

---

## 🎯 Project Overview

ARdent Study bridges the gap between passive reading and interactive learning by enabling:

- Scanning of textbook pages and handwritten notes  
- Automatic concept extraction (OCR + NLP)  
- Contextual enhancement with multimedia elements  
- AR overlays on physical content  
- Personalized learning based on user style  
- Collaborative knowledge graph for peer learning  
- Real-time quizzes and spaced repetition  

The platform supports both **mobile** and **web** applications, combining modern UI/UX with intelligent backend systems.

---

## 🚀 Core Features

### 📘 1. Content Scanning & Concept Extraction
- Extracts text using **OCR (Tesseract, EasyOCR)**
- Handwriting recognition using ML/CNN models
- Concept detection using **spaCy, Sentence-BERT**

### 🤖 2. AI-Powered Concept Enhancement
- Semantic understanding and explanation generation
- Multimedia retrieval (YouTube, Wikimedia, NASA 3D Models)
- Summaries & FAQs generated via GPT-4 / Claude APIs

### 🧊 3. AR Visualization
- AR overlays using **AR.js**, ARCore/ARKit  
- 3D model integration via Three.js, Unity, Blender

### 🧠 4. Collaborative Knowledge Graph
- Concept linking using **Neo4j graph database**
- Interactive visualization through D3.js / Cytoscape.js

### 🎯 5. Personalized Learning System
- Learns user study style  
- Spaced repetition algorithm (Anki-based)
- Adaptive difficulty quizzes

### 🎤 6. Speech-to-Text Notes
- Converts audio notes using speech recognition
- Integrates converted text into learning flow

### 📝 7. Smart Quizzes & Assessments
- Auto-generated quizzes from scanned content  
- Performance-adaptive questioning  
- Real-time feedback

---

## 🧰 Tech Stack

### **Frontend**
- React Native (Mobile App)
- React.js (Web App Interface)
- AR.js, Three.js for AR modules
- Figma / Adobe XD for UI/Mockups

### **Backend**
- Node.js + Express.js  
- Python (for ML modules: OCR, NLP, GNN)  
- APIs: GPT-4, Claude, Knowledge Graph APIs (Wikidata, ConceptNet)

### **Databases**
- Neo4j (Knowledge Graph)
- MongoDB / PostgreSQL (User data, quizzes, content)
- Cloud storage for multimedia

### **Machine Learning**
- **OCR:** Tesseract, EasyOCR  
- **NLP:** spaCy, BERT, Sentence-BERT  
- **Sketch Recognition:** CNN + GNN (TensorFlow/Keras)  

