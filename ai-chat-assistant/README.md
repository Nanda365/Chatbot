# AI-Powered Customer Support Chat Platform - Frontend

A production-ready, responsive React frontend for an AI-powered customer support chat system. This application supports both regular users (chat with AI, view chat history) and administrators (upload FAQs/documents, manage content).

## 🚀 Features

- **Authentication**: Secure JWT-based login and registration
- **Real-time Chat**: Interactive chat interface with typing indicators and message status
- **Admin Dashboard**: Upload and manage documents (PDF/DOCX) and FAQs
- **Chat History**: Paginated conversation history with search functionality
- **Settings**: Configure AI model preferences and API keys
- **Responsive Design**: Mobile-first design using Tailwind CSS
- **Role-based Access**: Separate views for users and administrators
- **Accessibility**: WCAG compliant with ARIA labels and keyboard navigation

## 📋 Prerequisites

- Node.js 18+ and npm
- Backend API running (see backend repository)

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-support-frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your backend URL
# VITE_API_BASE_URL=http://localhost:3000
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:3000

# Mock mode (set to 'true' to run frontend without backend)
VITE_MOCK_MODE=false
```

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Production Build

```bash
npm run build
npm run preview
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🐳 Docker Deployment

### Build Docker Image

```bash
docker build -t ai-support-frontend .
```

### Run Docker Container

```bash
docker run -p 80:80 \
  -e VITE_API_BASE_URL=http://your-backend-url:3000 \
  ai-support-frontend
```

## ☁️ Deployment Guides

### Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Set environment variables in Vercel dashboard:
   - `VITE_API_BASE_URL`: Your backend API URL

### Netlify Deployment

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run `netlify init`
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Set environment variables in Netlify dashboard

## 📁 Project Structure

```
src/
├── components/
│   ├── chat/              # Chat-related components
│   ├── layout/            # Layout components (Header, ProtectedRoute)
│   ├── ui/                # Reusable UI components (shadcn)
│   └── __tests__/         # Component tests
├── contexts/
│   └── AuthContext.tsx    # Authentication state management
├── lib/
│   ├── api.ts            # API client
│   └── utils.ts          # Utility functions
├── pages/
│   ├── auth/             # Authentication pages
│   ├── Admin.tsx         # Admin dashboard
│   ├── Chat.tsx          # Main chat page
│   ├── History.tsx       # Chat history
│   └── Settings.tsx      # Settings page
├── App.tsx               # Main app component with routing
└── main.tsx              # Application entry point
```

## 🔌 API Integration

The frontend connects to the backend via the following endpoints:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users/me` - Get user profile

### Chat
- `POST /api/chat/send` - Send message
- `GET /api/chat/history` - Get conversation history
- `GET /api/chat/history/:id` - Get specific conversation

### Admin (Admin only)
- `POST /api/docs/upload` - Upload document
- `GET /api/docs` - List documents
- `DELETE /api/docs/:id` - Delete document
- `POST /api/faqs` - Add FAQ
- `GET /api/search` - Search documents

## 🎨 Design System

The application uses a custom design system with:

- **Colors**: Professional blue gradient theme
- **Components**: Customized shadcn/ui components
- **Animations**: Smooth transitions and micro-interactions
- **Typography**: Clean, readable fonts

All colors are defined as HSL semantic tokens in `src/index.css`.

## 🔒 Security Features

- Input validation using Zod schemas
- JWT token management with secure storage
- Protection against XSS attacks
- CSRF protection headers
- Secure file upload validation
- Role-based access control

## 🧰 Tech Stack

- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Vite**: Build tool
- **React Router**: Client-side routing
- **Zustand/React Context**: State management
- **Zod**: Schema validation
- **Jest & React Testing Library**: Testing
- **ESLint & Prettier**: Code quality

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🐛 Known Issues

- Streaming responses are simulated (implement SSE for real-time streaming)
- File preview not implemented for uploaded documents
- Conversation loading from history needs backend integration

## 🗺️ Roadmap

- [ ] Implement real-time streaming for AI responses
- [ ] Add file preview for uploaded documents
- [ ] Implement conversation export (PDF, TXT)
- [ ] Add multi-language support
- [ ] Implement dark mode toggle
- [ ] Add voice input support
- [ ] Implement rich text editor for chat input

## 📞 Support

For issues and questions, please open an issue on GitHub or contact the development team.

---

Built with ❤️ using React, TypeScript, and Tailwind CSS
