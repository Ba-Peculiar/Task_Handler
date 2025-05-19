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
- Backend: Node.js
- Database: SQLlite3
- Authentication: JWT

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm 

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd task-handler
```

2. Install dependencies:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd client
npm install
```

3. Set up environment variables:
   - Create a `.env` file in the server directory

4. Start the development servers:
```bash
# Start backend server (from server directory)
cd server
node server.js

# Start frontend server (from client directory)
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 