'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Check, X, Plus, Trash, LogOut, 
  Loader2, AlertCircle, CheckCircle, 
  ChevronDown, Calendar, WifiOff
} from 'lucide-react';

interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  completed: number;
  created_at: string;
  synced?: boolean;
  last_modified?: number;
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [filter, setFilter] = useState('all');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [expandAddTask, setExpandAddTask] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Check authentication and load tasks on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let localStorageService: any;
    let syncService: any;
    const init = async () => {
      const { localStorageService: ls } = await import('@/utils/localStorage');
      const { syncService: ss } = await import('@/utils/syncService');
      localStorageService = ls;
      syncService = ss;
      const token = await localStorageService.getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }
      // Load tasks from local storage
      const userId = 1;
      const localTasks = await localStorageService.getTasks(userId);
      setTasks(localTasks);
      // If online, sync with server
      if (navigator.onLine) {
        try {
          const response = await fetch(`http://localhost:5000/api/tasks${filter !== 'all' ? `?status=${filter}` : ''}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.data && Array.isArray(data.data)) {
              for (const task of data.data) {
                await localStorageService.updateTask({
                  ...task,
                  synced: true,
                  last_modified: Date.now()
                });
              }
              setTasks(data.data);
            }
          }
        } catch (err) {
          // Continue with local data if sync fails
        }
      }
    };
    init();
  }, [router, filter]);

  // Handle online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    if (typeof window === 'undefined') return;
    const { localStorageService } = await import('@/utils/localStorage');
    await localStorageService.clearAuthToken();
    router.push('/login');
  };

  // Function to add a task
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      setError('Task title cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      if (typeof window === 'undefined') return;
      const { localStorageService } = await import('@/utils/localStorage');
      const { syncService } = await import('@/utils/syncService');
      const userId = 1;
      const newTask = {
        user_id: userId,
        title: newTaskTitle,
        description: newTaskDescription,
        completed: 0,
        created_at: new Date().toISOString()
      };
      const id = await localStorageService.addTask(newTask);
      setTasks([{ ...newTask, id }, ...tasks]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setSuccessMessage('Task added successfully!');
      setShowSuccessMessage(true);
      setExpandAddTask(false);
      if (navigator.onLine) {
        await syncService.sync();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Function to toggle completion
  const handleToggleComplete = async (task: Task) => {
    setLoading(true);
    try {
      if (typeof window === 'undefined') return;
      const { localStorageService } = await import('@/utils/localStorage');
      const { syncService } = await import('@/utils/syncService');
      const updatedTask = {
        ...task,
        completed: task.completed === 1 ? 0 : 1,
        synced: false,
        last_modified: Date.now()
      };
      await localStorageService.updateTask(updatedTask);
      setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
      setSuccessMessage(`Task marked as ${updatedTask.completed === 1 ? 'completed' : 'pending'}!`);
      setShowSuccessMessage(true);
      if (navigator.onLine) {
        await syncService.sync();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Function to delete a task
  const handleDeleteTask = async (taskId: number) => {
    setLoading(true);
    try {
      if (typeof window === 'undefined') return;
      const { localStorageService } = await import('@/utils/localStorage');
      const { syncService } = await import('@/utils/syncService');
      await localStorageService.deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      setSuccessMessage('Task deleted successfully!');
      setShowSuccessMessage(true);
      if (navigator.onLine) {
        await syncService.sync();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.completed === 1;
    if (filter === 'pending') return task.completed === 0;
    return true; // 'all' filter
  });

  // Success message timeout
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // Task animation variants
  const taskVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -10, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 pt-8 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">My Tasks</h1>
          <div className="flex items-center gap-4">
            {!isOnline && (
              <div className="flex items-center gap-2 text-amber-600">
                <WifiOff size={18} />
                <span className="text-sm">Offline Mode</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 flex items-center gap-2 bg-white text-red-500 font-medium rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 p-4 rounded-lg bg-green-100 text-green-700 flex items-center gap-2 shadow-md">
            <CheckCircle size={20} className="flex-shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-700 flex items-center gap-2 shadow-md">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p>{error}</p>
            <button 
              onClick={() => setError(null)} 
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Add New Task Section */}
        <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
          <div 
            className="p-6 cursor-pointer flex justify-between items-center"
            onClick={() => setExpandAddTask(!expandAddTask)}
          >
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Plus size={20} className={`text-indigo-500 transition-transform duration-300 ${expandAddTask ? 'rotate-45' : ''}`} />
              Add New Task
            </h2>
            <ChevronDown 
              size={20} 
              className={`text-gray-400 transition-transform duration-300 ${expandAddTask ? 'rotate-180' : ''}`} 
            />
          </div>
          
          {expandAddTask && (
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  id="taskTitle"
                  type="text"
                  className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  disabled={loading}
                  placeholder="What needs to be done?"
                />
              </div>
              <div>
                <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  id="taskDescription"
                  rows={3}
                  className="block w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  disabled={loading}
                  placeholder="Add some details about this task..."
                />
              </div>
              <div>
                <button
                  onClick={handleAddTask}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:scale-102"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Adding Task...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>Add Task</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Task List and Filters */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold text-gray-700">Tasks</h2>
              
              {/* Filter Buttons */}
              <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                <button
                  className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${filter === 'all' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setFilter('all')}
                  disabled={loading}
                >
                  All
                </button>
                <button
                  className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${filter === 'pending' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setFilter('pending')}
                  disabled={loading}
                >
                  Pending
                </button>
                <button
                  className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${filter === 'completed' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setFilter('completed')}
                  disabled={loading}
                >
                  Completed
                </button>
              </div>
            </div>

            {loading && tasks.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-gray-500">Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500 text-center">No tasks found for this filter.</p>
                <button 
                  onClick={() => setExpandAddTask(true)}
                  className="mt-4 text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1"
                >
                  <Plus size={16} />
                  <span>Add your first task</span>
                </button>
              </div>
            ) : (
              <ul className="space-y-4">
                {filteredTasks.map((task) => (
                  <li 
                    key={task.id}
                    className={`p-4 sm:p-6 rounded-xl border ${task.completed === 1 ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'} shadow-sm hover:shadow-md transition-all duration-200`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-grow">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleComplete(task)}
                            className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200 ${task.completed === 1 ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-indigo-500'}`}
                            disabled={loading}
                          >
                            {task.completed === 1 && <Check size={14} />}
                          </button>
                          <h3 className={`text-lg font-medium ${task.completed === 1 ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {task.title}
                          </h3>
                        </div>
                        {task.description && (
                          <p className={`mt-2 text-sm ${task.completed === 1 ? 'line-through text-gray-400' : 'text-gray-600'} ml-9`}>
                            {task.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2 ml-9">
                          Created: {new Date(task.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex sm:flex-col gap-2 sm:gap-3 ml-9 sm:ml-0">
                        <button
                          onClick={() => handleToggleComplete(task)}
                          className={`flex-1 sm:w-full flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm rounded-lg transition-all duration-200 ${
                            task.completed === 1 
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                          }`}
                          disabled={loading}
                        >
                          {task.completed === 1 ? (
                            <>
                              <X size={14} />
                              <span className="hidden sm:inline">Pending</span>
                            </>
                          ) : (
                            <>
                              <Check size={14} />
                              <span className="hidden sm:inline">Complete</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="flex-1 sm:w-full flex items-center justify-center gap-1 px-3 py-2 text-xs sm:text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 transition-all duration-200"
                          disabled={loading}
                        >
                          <Trash size={14} />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}