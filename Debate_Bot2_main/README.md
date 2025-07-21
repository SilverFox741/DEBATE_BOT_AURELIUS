# AI Debate Practice System

## 🚀 Quick Start & Setup

### Prerequisites
- **Node.js 18+**
- **web browser** (Chrome)
- **Gemini API key** from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation & Running
```bash
# Clone the repository
cd Debate_Bot2_main

# Install dependencies
npm install
OR (If above command doesn't work)
npm i --legacy-peer-deps
OR (If it still doesn't work)
npm install --force

# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

### API Key Setup
1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Enter the API key in the application when prompted
3. The system will test the connection automatically

### Build for Production
```bash
npm run build
```
The built files will be in the `dist/` directory, ready for deployment.

---

# 🏆 Project Overview

## Problem Statement
Traditional debate practice is limited by access to skilled opponents, inconsistent feedback, lack of structured progression, and difficulty tracking improvement. Our system solves these with AI-powered, real-time, skill-adaptive debate simulation and mathematical judging.

## Solution
- **Intelligent AI Opponents**: Context-aware, skill-adaptive debaters
- **Mathematical Judging**: Objective, weighted clash analysis
- **Comprehensive Feedback**: 6-dimensional, actionable insights
- **Real-time Simulation**: Live debate, typing effects, timing
- **Progress Tracking**: Detailed history and analytics

---

# 🎯 Key Features

- **AI-Generated Case Prep**: Strategic arguments, rebuttals, evidence
- **Skill-Based Learning**: Beginner, Intermediate, Advanced
- **Parliamentary Debate Format**: Realistic roles and structure
- **Mathematical Judging**: Weighted clash analysis, bias prevention
- **Comprehensive Feedback**: Criteria-based, actionable, transparent
- **Live Simulation**: Typing effects, timing, real-time AI adaptation
- **Progress Tracking**: History, analytics, downloadable transcripts
- **Modern UI/UX**: Responsive, accessible, smooth navigation

---

# 🧑‍💻 User Journey & Demo Flow

1. **API Setup**: Enter Gemini API key
2. **Motion Selection**: Choose from 8+ pre-built or custom motions
3. **Debate Configuration**: Pick side, role, AI skill level
4. **Case Preparation**: Review AI-generated arguments, rebuttals, evidence
5. **Live Debate**: Type speeches, see AI respond in real time
6. **Results & Feedback**: Get mathematical scores, clash-by-clash analysis, actionable suggestions
7. **History & Download**: Review past debates, download full transcripts/results

---

# 🛠️ Technical Architecture

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: Google Gemini 1.5 Flash API
- **Build Tool**: Vite
- **Icons**: Lucide React
- **State Management**: React Hooks + Custom Hooks
- **Persistence**: Local storage (no backend required)

## Key Files
```
Debate_Bot2_main/
├── App.tsx                 # Main application
├── main.tsx                # Entry point
├── debate.ts               # Core types
├── gemini.ts               # Gemini AI service
├── motions.ts              # Motions & roles
├── aiPersonalities.ts      # AI debater configs
├── useDebateSession.ts     # Session management
├── useDebateHistory.ts     # History management
├── transcriptUtils.ts      # Transcript generation
├── ... (UI components)
```

---

# 📊 Mathematical Judging Algorithm

- **Clash Identification**: AI finds major argument conflicts
- **Weight Assignment**: Each clash gets an importance score (1-10)
- **Clash Resolution**: Winners determined by logic, evidence
- **Score Calculation**: Σ(ClashWeight × ClashOutcome × CriteriaMultiplier) / TotalPossiblePoints × 100
- **Bias Prevention**: Multiple evaluation passes

### Evaluation Criteria
- **Argument Quality** (8.5/10)
- **Logical Coherence** (8.0/10)
- **Rhetorical Techniques** (7.5/10)
- **Response to Opposition** (8.0/10)
- **Structure & Time Management** (9.0/10)
- **Delivery & Presentation** (8.5/10)

---

# 🏅 Innovation Highlights

1. **Mathematical Judging**: Unique weighted clash analysis
2. **Real-time AI Adaptation**: Contextual, role-specific responses
3. **Comprehensive Feedback**: 6-dimensional, actionable, transparent
4. **Skill-Based Learning**: Progressive difficulty, realistic AI
5. **Modern UI/UX**: Professional, accessible, smooth

---

# 📈 Performance & Metrics
- **Build Size**: ~234KB (68KB gzipped)
- **Load Time**: < 2 seconds
- **AI Response Time**: < 5 seconds
- **Memory Usage**: < 50MB
- **Compatibility**: All modern browsers

---

# 🎮 Demo Tips
- Start with Beginner level to show accessibility
- Demonstrate skill progression (Intermediate, Advanced)
- Highlight mathematical scoring and feedback
- Show real-time features and transcript download
- Emphasize educational value and actionable feedback

---

# 🚀 Future Enhancements
- **Voice Recognition**: Speech-to-text for natural interaction
- **Multiplayer Support**: Real-time collaborative debates
- **Advanced Analytics**: Detailed performance tracking
- **Custom Motions**: User-generated topics
- **Mobile App**: Native iOS/Android
- **Tabbycat Integration**: Tournament management

---

# 👥 Team
**AI Debate Champions**
- Built with passion for debate education
- Leveraging cutting-edge AI technology
- Focused on impactful learning experiences

---

# 📄 License
MIT License - Open source for educational purposes

---

**Ready for IIT Delhi Hackathon Submission & Real-World Use!** 🚀
