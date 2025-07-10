# Scam Conversation Simulation System

This is a Next.js application designed to simulate scam conversations for research purposes. The system allows users to interact with AI-powered scam scenarios to study human behavior and decision-making in potentially fraudulent situations.

## 🎯 System Overview

Scamvisor is a multi-phase research platform that includes:

- **Demographic Survey**: Collects participant information and digital literacy assessments
- **Instructional Videos**: Provides context about the study and scam scenarios
- **Attention Check**: Ensures participants understand the system before proceeding
- **Interactive Chat Simulations**: AI-powered conversations simulating different scam scenarios
- **Post-Interaction Feedback**: Collects participant responses and experiences

## 🏗️ Architecture

### Frontend

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Hooks** for state management

### Backend

- **Next.js API Routes** for server-side logic
- **MongoDB** for data storage
- **JWT Authentication** for user sessions

### AI Integration

- **Google Gemini** for conversation generation
- **Multiple AI Agents** simulating different personas (scammer, victim, advisor)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- MongoDB instance (local or cloud)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd v-qal
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:

   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string

   # Authentication
   JWT_SECRET=your_jwt_secret_key

   # AI Services
   GEMINI_API_KEY=your_gemini_api_key

   # Optional: Development
   NODE_ENV=development
   ```

4. **Database Setup**

   - Ensure MongoDB is running
   - The application will automatically create collections on first use

5. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**


   Because this project will be hosted in Prolific soon, we have to follow a custom URL approach to try out the system.
   Once you run "npm run dev", depending on the URL (e.g., 3000, 3001), include the following parameters.
   [http://localhost:3000?PROLIFIC_PID=test01&STUDY_ID=test_study_1&SESSION_ID=test_session_1]

   Notice that there is a PROLIFIC_PID, which is a one-time sign in only, so if you would like to try the system again, change test01 to test02 or any custom string.

## 📁 Project Structure

```
v-qal/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── advice/              # Advice submission
│   │   ├── auth/                # Authentication
│   │   ├── conversations/       # Chat management
│   │   ├── feedback/            # Feedback collection
│   │   ├── survey/              # Survey responses
│   │   └── quiz/                # Quiz attempts
│   ├── chatal/                  # Chat model A
│   ├── chatqal/                 # Chat model B
│   ├── chatql/                  # Chat model C
│   ├── survey/                  # Demographic survey
│   ├── attention-check/         # Attention verification
│   ├── video-instructions/      # Instructional videos
│   └── post-survey/             # Post-interaction survey
├── components/                   # Reusable components
│   ├── ui/                      # UI components
│   ├── quiz/                    # Quiz components
│   └── common/                  # Common components
├── lib/                         # Utility libraries
├── models/                      # MongoDB schemas
├── utils/                       # Helper functions
│   └── prompts/                 # AI prompt templates
└── public/                      # Static assets
```

## 🔄 User Flow

### 1. **Landing Page** (`/`)

- Welcome screen with study information
- Sign-in functionality

### 2. **Demographic Survey** (`/survey`)

- Collects participant demographics
- Digital literacy assessments (5 likert scales)
- Technology skills evaluation
- Online behavior patterns

### 3. **Video Instructions** (`/video-instructions`)

- Instructional videos about the study
- Random scenario assignment (Pig Butchering vs Imposter Scam)
- Video completion tracking

### 4. **Attention Check** (`/attention-check`)

- Verifies understanding of the system
- Multiple choice questions about video content
- Must pass to proceed

### 5. **Chat Simulation** (`/chatal`, `/chatqal`, etc.)

- AI-powered conversation simulation
- Multiple phases with different scenarios
- Quiz questions between phases
- Advice collection from participants

### 6. **Post-Survey** (`/post-survey`)

- Feedback collection
- Experience evaluation
- Study completion

## 🤖 AI Models & Scenarios

### Chat Models

- **ChatAL**: Advanced language model for complex scenarios
- **ChatQAL**: Question-answer focused interactions
- **ChatQL**: Query-based conversation model

### Scam Scenarios

1. **Pig Butchering Scam**: Investment fraud simulation
2. **Imposter Scam**: Identity theft simulation

### AI Personas

- **Scammer**: AI simulating fraudulent behavior
- **Victim**: AI simulating vulnerable individual
- **Advisor**: AI providing guidance and advice

## 📊 Data Collection

The system collects various types of data:

### Participant Information

- Demographics (age, gender, education, occupation)
- Digital literacy assessments
- Technology skills evaluation
- Online behavior patterns

### Interaction Data

- Chat conversations
- Quiz responses
- Advice provided
- Time spent on each phase

### Feedback Data

- Post-interaction surveys
- Experience ratings
- Qualitative feedback

## 🔧 Configuration

### Environment Variables

- `MONGODB_URI`: Database connection string
- `JWT_SECRET`: Authentication secret
- `GEMINI_API_KEY`: AI service API key

### AI Prompt Configuration

Prompts are stored in `utils/prompts/` and can be customized for:

- Different scam scenarios
- AI persona behaviors
- Quiz question generation
- Feedback collection

## 🧪 Development

### Running Tests

```bash
npm run test
```

### Building for Production

```bash
npm run build
npm start
```

### Code Quality

```bash
npm run lint
npm run type-check
```

## 📈 Analytics & Monitoring

The system includes built-in analytics for:

- Participant progression through phases
- Quiz performance tracking
- Conversation quality metrics
- System usage statistics

## 🔒 Security & Privacy

- **JWT Authentication**: Secure user sessions
- **Data Encryption**: Sensitive data protection
- **Privacy Compliance**: GDPR-compliant data handling
- **Access Control**: Role-based permissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🆘 Support

For questions or issues:

1. Check the existing issues
2. Create a new issue with detailed information
3. Contact the development team at skamal1@swarthmore.edu

## 🔄 Updates & Maintenance

- Regular security updates
- AI model improvements
- UI/UX enhancements
- Performance optimizations

---

**Note**: This system is designed for research purposes only. All interactions are simulated and monitored for educational and research objectives.
