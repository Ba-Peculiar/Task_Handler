const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 5000; 
const jwtSecret = process.env.JWT_SECRET;
const dbUrl = process.env.DATABASE_URL;

// Middleware
app.use(cors()); 
app.use(express.json()); 

// --- Database Setup ---
const db = new sqlite3.Database(dbUrl, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Create tables if they don't exist
    db.serialize(() => {
      // Users table for authentication
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )`, (createUsersErr) => {
        if (createUsersErr) {
          console.error('Error creating users table:', createUsersErr.message);
        } else {
          console.log('Users table ready.');
        }
      });

      // Tasks table
      db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`, (createTasksErr) => {
        if (createTasksErr) {
          console.error('Error creating tasks table:', createTasksErr.message);
        } else {
          console.log('Tasks table ready.');
        }
      });
    });
  }
});

// --- Middleware to protect routes (JWT Authentication) ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (token == null) {
    return res.sendStatus(401); 
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.sendStatus(403); 
    }
    req.user = user;
    next(); 
  });
};


// --- API Endpoints ---

// Basic root endpoint
app.get('/', (req, res) => {
  res.send('Task Handler Backend is running!');
});

// User Registration
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); 

    // Insert the new user into the database
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed: users.username')) {
          return res.status(409).json({ message: 'Username already exists' });
        }
        console.error('Database error during registration:', err.message);
        return res.status(500).json({ message: 'Error registering user' });
      }

      // User registered successfully
      res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
    });

  } catch (hashError) {
    console.error('Error hashing password:', hashError);
    res.status(500).json({ message: 'Error processing registration' });
  }
});

// User Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  // Find the user in the database
  db.get('SELECT id, username, password FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      console.error('Database error during login:', err.message);
      return res.status(500).json({ message: 'Error logging in' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    try {
      // Compare the provided password with the stored hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      // Passwords match, generate a JWT token
      const accessToken = jwt.sign({ id: user.id, username: user.username }, jwtSecret, { expiresIn: '1h' }); 

      res.json({ message: 'Login successful', token: accessToken });

    } catch (compareError) {
      console.error('Error comparing passwords:', compareError);
      res.status(500).json({ message: 'Error processing login' });
    }
  });

  // --- Protected Task Endpoints ---

// GET all tasks for the authenticated user (with optional filtering)
app.get('/api/tasks', authenticateToken, (req, res) => {
    const userId = req.user.id; 
    const { status } = req.query; 
  
    let sql = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [userId];
  
    if (status === 'completed') {
      sql += ' AND completed = 1';
    } else if (status === 'pending') {
      sql += ' AND completed = 0';
    }
    
  
    sql += ' ORDER BY created_at DESC'; 
  
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Database error fetching tasks:', err.message);
        res.status(500).json({ message: 'Error fetching tasks' });
        return;
      }
      res.json({
        message: 'success',
        data: rows
      });
    });
  });
  
  // GET a specific task for the authenticated user
  app.get('/api/tasks/:id', authenticateToken, (req, res) => {
    const userId = req.user.id; 
    const taskId = req.params.id;
  
    db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId], (err, row) => {
      if (err) {
        console.error('Database error fetching task:', err.message);
        res.status(500).json({ message: 'Error fetching task' });
        return;
      }
      if (!row) {
        return res.status(404).json({ message: 'Task not found or does not belong to user' });
      }
      res.json({
        message: 'success',
        data: row
      });
    });
  });
  
  // POST a new task for the authenticated user
  app.post('/api/tasks', authenticateToken, (req, res) => {
    const userId = req.user.id; 
    const { title, description } = req.body;
  
    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }
  
    // Insert the new task into the database
    db.run('INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)',
      [userId, title, description],
      function(err) { 
        if (err) {
          console.error('Database error creating task:', err.message);
          res.status(500).json({ message: 'Error creating task' });
          return;
        }
        // Return the newly created task including its ID and default values
        db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (selectErr, newTask) => {
           if (selectErr) {
              console.error('Error fetching newly created task:', selectErr.message);
              res.status(201).json({ message: 'Task created successfully', taskId: this.lastID });
           } else {
              res.status(201).json({
                message: 'Task created successfully',
                data: newTask
              });
           }
        });
      }
    );
  });
  
  // PUT to update a task for the authenticated user
  app.put('/api/tasks/:id', authenticateToken, (req, res) => {
    const userId = req.user.id; 
    const taskId = req.params.id;
    const { title, description, completed } = req.body; 

    // First check if the task exists and belongs to the user
    db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId], (err, task) => {
      if (err) {
        console.error('Database error checking task:', err.message);
        return res.status(500).json({ message: 'Error updating task' });
      }

      if (!task) {
        return res.status(404).json({ message: 'Task not found or does not belong to user' });
      }

      // Build the update query based on provided fields
      const updates = [];
      const params = [];
      
      if (title !== undefined) {
        updates.push('title = ?');
        params.push(title);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      if (completed !== undefined) {
        updates.push('completed = ?');
        params.push(completed ? 1 : 0);
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }

      
      params.push(taskId, userId);

      
      const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
      
      db.run(sql, params, function(err) {
        if (err) {
          console.error('Database error updating task:', err.message);
          return res.status(500).json({ message: 'Error updating task' });
        }

        // Fetch and return the updated task
        db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (selectErr, updatedTask) => {
          if (selectErr) {
            console.error('Error fetching updated task:', selectErr.message);
            return res.status(500).json({ message: 'Error fetching updated task' });
          }
          
          res.json({
            message: 'Task updated successfully',
            data: updatedTask
          });
        });
      });
    });
  });
  
  // DELETE a task for the authenticated user
  app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
    const userId = req.user.id; 
    const taskId = req.params.id;
  
    const sql = 'DELETE FROM tasks WHERE id = ? AND user_id = ?';
    const params = [taskId, userId];
  
    db.run(sql, params, function(err) { 
      if (err) {
        console.error('Database error deleting task:', err.message);
        res.status(500).json({ message: 'Error deleting task' });
        return;
      }
      if (this.changes === 0) {
         // Check if the task existed and belonged to the user
        db.get('SELECT 1 FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId], (checkErr, row) => {
            if (checkErr || !row) {
                 return res.status(404).json({ message: 'Task not found or does not belong to user' });
            }
             // Task found but not deleted (shouldn't happen with correct SQL)
             res.status(500).json({ message: 'Failed to delete task' });
        });
      } else {
        res.json({ message: 'Task deleted successfully' });
      }
    });
  });
});

// --- Start the server ---
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Database file: ${dbUrl}`);
});

//Close the database connection when the Node process exits
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Closed the database connection.');
    process.exit(0);
  });
});