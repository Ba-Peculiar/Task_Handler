'use client'; // This is a client component

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
import { useRouter } from 'next/navigation';

interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
}

export default function TasksPage() {
  const { token, logout } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]); // Redirect if token changes or router is available

  // Fetch tasks when component mounts or filter/token changes
  useEffect(() => {
    if (token) { // Only fetch if authenticated
      const fetchTasks = async () => {
        setLoading(true);
        setError(null);
        try {
          const endpoint = filter === 'all' ? '/tasks' : `/tasks?status=${filter}`;
          const response = await apiGet(endpoint, token);
          setTasks(response.data || []);
        } catch (err: any) {
          console.error('Failed to fetch tasks:', err);
          setError(err.message || 'Failed to load tasks.');
          if (err.message.includes('Authentication required') || err.message.includes('401') || err.message.includes('403')) {
            logout();
          }
        } finally {
          setLoading(false);
        }
      };
      fetchTasks();
    }
  }, [token, filter, logout]); // Re-fetch if token or filter changes

  // Handle adding a new task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      alert('Task title cannot be empty.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiPost('/tasks', {
        title: newTaskTitle,
        description: newTaskDescription,
      }, token);
      if (response && response.data) {
        setTasks([response.data, ...tasks]);
        setNewTaskTitle('');
        setNewTaskDescription('');
      } else {
        setError('Failed to add task.');
      }
    } catch (err: any) {
      console.error('Failed to add task:', err);
      setError(err.message || 'Failed to add task.');
      if (err.message.includes('Authentication required') || err.message.includes('401') || err.message.includes('403')) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle toggling task completion status
  const handleToggleComplete = async (task: Task) => {
    setLoading(true);
    setError(null);
    try {
      await apiPut(`/tasks/${task.id}`, { completed: !task.completed }, token);
      setTasks(tasks.map(t =>
        t.id === task.id ? { ...t, completed: !t.completed } : t
      ));
    } catch (err: any) {
      console.error('Failed to update task:', err);
      setError(err.message || 'Failed to update task.');
      if (err.message.includes('Authentication required') || err.message.includes('401') || err.message.includes('403')) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a task
  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiDelete(`/tasks/${taskId}`, token);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err: any) {
      console.error('Failed to delete task:', err);
      setError(err.message || 'Failed to delete task.');
      if (err.message.includes('Authentication required') || err.message.includes('401') || err.message.includes('403')) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    // Optionally show a loading state or null while redirecting
    return <div className="flex min-h-screen items-center justify-center">Redirecting to login...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Tasks</h1>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          disabled={loading}
        >
          Logout
        </button>
      </div>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      {/* Add New Task Form */}
      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              id="taskTitle"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              disabled={loading}
            />
          </div>
           <div>
            <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              id="taskDescription"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={loading}
            >
              {loading ? 'Adding Task...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>

      {/* Task List and Filters */}
      <div className="bg-white p-6 rounded shadow-md">
         <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Tasks</h2>
            {/* Filter Buttons */}
            <div>
                <button
                    className={`mr-2 px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setFilter('all')}
                    disabled={loading}
                >
                    All
                </button>
                 <button
                    className={`mr-2 px-3 py-1 rounded ${filter === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setFilter('pending')}
                     disabled={loading}
                >
                    Pending
                </button>
                 <button
                    className={`px-3 py-1 rounded ${filter === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setFilter('completed')}
                     disabled={loading}
                >
                    Completed
                </button>
            </div>
         </div>


        {loading && tasks.length === 0 ? (
          <p className="text-center text-gray-600">Loading tasks...</p>
        ) : tasks.length === 0 ? (
           <p className="text-center text-gray-600">No tasks found for this filter.</p>
        ) : (
          <ul className="space-y-4">
            {tasks.map((task) => (
              <li key={task.id} className={`p-4 border rounded-md shadow-sm flex justify-between items-center ${task.completed ? 'bg-green-100 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                <div>
                  <h3 className={`text-lg font-medium ${task.completed ? 'line-through text-gray-600' : 'text-gray-900'}`}>{task.title}</h3>
                  {task.description && <p className={`text-sm text-gray-600 ${task.completed ? 'line-through' : ''}`}>{task.description}</p>}
                   <p className="text-xs text-gray-500 mt-1">Created: {new Date(task.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className={`px-3 py-1 text-sm rounded ${task.completed ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'} text-white focus:outline-none focus:ring-2 focus:ring-opacity-50 ${task.completed ? 'focus:ring-yellow-500' : 'focus:ring-blue-500'}`}
                     disabled={loading}
                  >
                    {task.completed ? 'Mark Pending' : 'Mark Complete'}
                  </button>
                   <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="px-3 py-1 text-sm rounded bg-red-500 hover:bg-red-600 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                     disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}