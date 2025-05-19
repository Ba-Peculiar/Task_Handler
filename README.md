# Task Handler

A full-stack task management application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- User authentication (register/login)
- Create, read, update, and delete tasks
- Mark tasks as complete/incomplete
- Filter tasks by status (all/completed/pending)
- Responsive design with Tailwind CSS

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Node.js, Express
- Database: PostgreSQL
- Authentication: JWT

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL

### Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd task-handler
```

2. Install dependencies:
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Create a `.env` file in the client directory

4. Start the development servers:
```bash
# Start backend server (from root directory)
npm run dev

# Start frontend server (from client directory)
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Project Structure

```
task-handler/
├── client/             # Frontend Next.js application
│   ├── src/
│   │   ├── app/       # Next.js app directory
│   │   ├── components/# React components
│   │   ├── context/   # React context providers
│   │   └── utils/     # Utility functions
│   └── public/        # Static files
└── server/            # Backend Express application
    ├── src/
    │   ├── controllers/# Route controllers
    │   ├── middleware/ # Custom middleware
    │   ├── models/    # Database models
    │   └── routes/    # API routes
    └── config/        # Configuration files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 