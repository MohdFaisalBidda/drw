# 🎨 Drw - Collaborative Whiteboard for Visual Creativity

<div align="center">

![Drw Logo](./apps/web/public/logo1.png)

### Draw, sketch, and brainstorm together in real-time ✨

[![Demo Video](https://img.shields.io/badge/🎥-Watch%20Demo-purple?style=for-the-badge)](./apps/web/public/drw.mp4)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-green?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=flat-square&logo=Prisma&logoColor=white)](https://prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 🚀 Live Demo

🎬 **[Watch Demo Video](./apps/web/public/drw.mp4)** - See Drw in action!

## 📖 Overview

Drw is a modern, full-featured collaborative whiteboard application that enables teams to create, share, and collaborate on visual content in real-time. Built with cutting-edge technologies, it provides a seamless drawing experience for teams who think visually.

## ✨ Key Features

### 🎨 **Drawing & Design Tools**
- 🖊️ **Natural Drawing**: Fluid, hand-drawn strokes with pencil tool
- 📐 **Geometric Shapes**: Rectangles, circles, diamonds, lines, and arrows
- 📝 **Text Tools**: Add and edit text directly on the canvas
- 🧽 **Eraser Tool**: Clean and precise erasing capabilities
- 🎯 **Selection Tool**: Select, move, and manipulate objects
- 🖐️ **Hand Tool**: Pan and navigate around the canvas

### 👥 **Real-time Collaboration**
- ⚡ **Live Collaboration**: Multiple users can draw simultaneously
- 👀 **Live Cursors**: See where other users are working in real-time
- 👤 **User Presence**: Track who's online and active in the room
- 🔄 **Instant Sync**: Zero-latency synchronization across all devices
- 💾 **Auto-save**: Automatic saving with IndexedDB for offline persistence

### 🔐 **User Management & Security**
- 🔑 **Authentication**: Secure login with NextAuth.js
- 👤 **User Profiles**: Personalized user accounts and settings
- 🏠 **Room Management**: Create and join private drawing rooms
- 🔒 **Anonymous Drawing**: Option to draw without registration

### 🎛️ **Advanced Features**
- 🔍 **Zoom Controls**: Zoom in/out for detailed work
- 📸 **Screenshot Export**: Export canvas as PNG images (Upcoming)
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🌓 **Dark Theme**: Beautiful dark interface for comfortable drawing
- ⚙️ **Properties Panel**: Customize shapes, colors, and properties

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[React 19](https://react.dev/)** - UI library with latest features
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** - Smooth animations
- **[Radix UI](https://www.radix-ui.com/)** - Accessible UI components
- **[Zustand](https://zustand-demo.pmnd.rs/)** - State management
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication

### Backend
- **[Node.js](https://nodejs.org/)** - JavaScript runtime
- **[WebSockets (ws)](https://github.com/websockets/ws)** - Real-time communication
- **[Prisma](https://prisma.io/)** - Database ORM and schema management
- **[PostgreSQL](https://www.postgresql.org/)** - Robust relational database
- **[JWT](https://jwt.io/)** - Secure token-based authentication

### DevOps & Tools
- **[Turborepo](https://turbo.build/)** - Monorepo management and build system
- **[Docker](https://www.docker.com/)** - Containerization and deployment
- **[ESLint](https://eslint.org/)** - Code linting and quality
- **[Prettier](https://prettier.io/)** - Code formatting

## 🏗️ Architecture

```
exceli-draw/
├── apps/
│   ├── web/                 # Next.js frontend application
│   └── ws-backend/          # WebSocket server for real-time features
├── packages/
│   ├── db/                  # Prisma database schema and client
│   ├── ui/                  # Shared React components
│   ├── common/              # Shared utilities and types
│   ├── backend-common/      # Backend utilities
│   ├── eslint-config/       # ESLint configurations
│   └── typescript-config/   # TypeScript configurations
├── docker/                  # Docker configurations
└── public/                  # Static assets (logo, demo video)
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or later)
- **npm** or **pnpm**
- **PostgreSQL** (or use Docker)
- **Docker & Docker Compose** (optional, for containerized setup)

### 🔧 Installation

#### Option 1: Local Development

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/exceli-draw.git
cd exceli-draw
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
```

3. **Set up environment variables**
```bash
# Copy example environment files
cp .env.example .env

# Configure your environment variables:
# - DATABASE_URL (PostgreSQL connection string)
# - NEXTAUTH_SECRET (for NextAuth.js)
# - JWT_SECRET (for WebSocket authentication)
# - GEMINI_API_KEY (for AI features)
```

4. **Set up the database**
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
cd packages/db && npx prisma migrate dev
```

5. **Start the development servers**
```bash
# Start all services (web app + WebSocket server)
npm run dev

# Or start individual services:
npm run start:web        # Frontend (port 3000)
npm run start:websocket  # WebSocket server (port 8080)
```

#### Option 2: Docker Development

1. **Clone and configure**
```bash
git clone https://github.com/yourusername/exceli-draw.git
cd exceli-draw
cp .env.example .env
```

2. **Start with Docker Compose**
```bash
docker-compose up -d
```

3. **Access the application**
- Frontend: http://localhost:3000
- WebSocket Server: ws://localhost:8080
- PostgreSQL: localhost:5432

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all development servers |
| `npm run build` | Build all applications for production |
| `npm run start` | Start production servers |
| `npm run lint` | Run ESLint across all packages |
| `npm run format` | Format code with Prettier |
| `npm run db:generate` | Generate Prisma client |

## 🎯 Usage

### Creating a Drawing Session

1. **Sign up/Login** or choose anonymous mode
2. **Create a room** with a custom name
3. **Share the room link** with collaborators
4. **Start drawing** with the intuitive toolbar

### Drawing Tools

- **🎯 Select**: Click and drag to select objects
- **🖐️ Hand**: Pan around the canvas
- **⭕ Circle**: Draw perfect circles
- **⬜ Rectangle**: Create rectangular shapes
- **💎 Diamond**: Draw diamond shapes
- **📏 Line**: Draw straight lines
- **➡️ Arrow**: Create directional arrows
- **✏️ Pencil**: Free-hand drawing
- **📝 Text**: Add text annotations
- **🧽 Eraser**: Remove elements

### Keyboard Shortcuts (Upcoming)

| Key | Action |
|-----|--------|
| `V` | Select tool |
| `H` | Hand tool |
| `R` | Rectangle |
| `O` | Circle |
| `L` | Line |
| `T` | Text |
| `P` | Pencil |
| `E` | Eraser |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Y` | Redo |
| `Delete` | Delete selected |

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/exilidraw"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# WebSocket Authentication
JWT_SECRET="your-jwt-secret"

# AI Features (Optional)
GEMINI_API_KEY="your-gemini-api-key"
```

### Database Schema

The application uses the following main models:

- **User**: User accounts and authentication
- **Room**: Drawing room sessions
- **Shape**: Individual drawing elements and their properties

## 🚀 Deployment

### Production Build

```bash
# Build all applications
npm run build

# Start production servers
npm run start
```

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy containers
docker-compose -f docker-compose.prod.yml up -d
```

### Vercel Deployment

The frontend is optimized for Vercel deployment:

```bash
# Deploy to Vercel
vercel deploy

# Set environment variables in Vercel dashboard
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 🐛 Troubleshooting

### Common Issues

**WebSocket Connection Failed**
- Ensure WebSocket server is running on port 8080
- Check firewall settings
- Verify JWT_SECRET is configured

**Database Connection Error**
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Run `npm run db:generate`

**Build Errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Turbo cache: `npx turbo clean`

## 📈 Performance

- **Real-time sync**: <50ms latency for most operations
- **Concurrent users**: Supports 100+ users per room
- **Canvas size**: Unlimited canvas with efficient viewport rendering
- **Offline support**: IndexedDB persistence for offline drawing

## 🔒 Security

- JWT-based WebSocket authentication
- CSRF protection with NextAuth.js
- SQL injection prevention with Prisma
- Input validation and sanitization
- Rate limiting on WebSocket connections

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Excalidraw** - Inspiration for the drawing experience
- **Figma** - UI/UX inspiration
- **Vercel** - Deployment platform
- **Open Source Community** - Amazing tools and libraries

## 📞 Support

- 📧 **Email**: [your-email@example.com](mailto:biddafaisal@gmail.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/MohdFaisalBidda/drw/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/MohdFaisalBidda/drw/discussions)

---

<div align="center">

**Made with ❤️ by Faisal**

⭐ Star this repo if you found it helpful!

</div>
