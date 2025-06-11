# Drw (Collaborative Drawing Application)

A full-featured collaborative drawing platform built with Next.js, WebSockets, and modern web technologies. This monorepo project enables real-time collaborative drawing, user management, and project sharing.

## Features

- **Real-time Collaboration**: Draw together with multiple users simultaneously
- **User Authentication**: Secure login and user management
- **Project Sharing**: Create and share drawing projects with team members
- **Responsive Design**: Works on desktop and mobile devices
- **Offline Support**: Continue working when disconnected and sync when reconnected

## Tech Stack

### Frontend

- [Next.js](https://nextjs.org/) - React framework for web applications
- TypeScript - For type safety and better developer experience
- React - UI library
- Socket.io-client - For real-time WebSocket communication

### Backend

- Node.js - JavaScript runtime
- Express - Web framework
- WebSockets - For real-time communication
- Prisma - Database ORM
- PostgreSQL - Database

### DevOps & Infrastructure

- Docker - Containerization
- Turborepo - Monorepo management
- ESLint - Code linting
- Prettier - Code formatting

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or pnpm
- Docker and Docker Compose (for containerized setup)
- PostgreSQL (if running locally without Docker)

### Installation

#### Option 1: Local Development with npm/pnpm

1. Clone the repository:

```sh
git clone https://github.com/yourusername/collaborative-drawing-app.git
cd collaborative-drawing-app
```

2. Install dependencies:

```sh
pnpm install
# or
npm install
```

3. Set up environment variables:

```sh
cp .env.example .env
# Edit .env with your database credentials and other configurations
```

4. Set up the database:

```sh
pnpm db:migrate
# or
npm run db:migrate
```

5. Start the development server:

```sh
pnpm dev
# or
npm run dev
```

#### Option 2: Docker Development

1. Clone the repository:

```sh
git clone https://github.com/yourusername/collaborative-drawing-app.git
cd collaborative-drawing-app
```

2. Create and configure environment file:

```sh
cp .env.example .env
# Edit .env with appropriate values
```

3. Build and start the Docker containers:

```sh
docker-compose up -d
```

4. Access the application at `http://localhost:3000`

## Project Structure

This Turborepo includes the following packages/apps:

### Apps and Packages

- `web`: Next.js web frontend application
- `api`: HTTP backend server
- `socket`: WebSocket backend server for real-time updates
- `docs`: Documentation site built with Next.js
- `@repo/ui`: Shared React component library
- `@repo/eslint-config`: ESLint configurations
- `@repo/typescript-config`: TypeScript configurations
- `@repo/database`: Prisma schema and database utilities

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd my-turborepo
pnpm build
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo
pnpm dev
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
npx turbo link
```

## Deployment

### Production Build

To create a production build:

```
pnpm build
# or
npm run build
```

### Docker Production Deployment

1. Build the production Docker image:

```sh
docker-compose -f docker-compose.prod.yml build
```

2. Deploy the containers:

```sh
docker-compose -f docker-compose.prod.yml up -d
```

## Testing

Run tests across all packages:

```
pnpm test
# or
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)
