// TodoApp.js
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import './TodoApp.css';

const TodoApp = ({ user }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    subject: '',
    description: '',
    dueDate: '',
    dueTime: '',
    status: 'Not Started',
    priority: 'Medium'
  });

  const [filter, setFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dueDate');
  const [editingTask, setEditingTask] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // Validation states
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  // Validation configuration
  const validationConfig = {
    subject: {
      required: true,
      minLength: 3,
      maxLength: 100,
      specialChars: false
    },
    description: {
      required: false,
      minLength: 0,
      maxLength: 500,
      specialChars: true
    },
    dueDate: {
      required: true
    },
    dueTime: {
      required: true
    }
  };

  // Validation functions
  const validateField = (fieldName, value) => {
    const config = validationConfig[fieldName];
    const fieldErrors = [];

    if (config.required && (!value || value.trim() === '')) {
      fieldErrors.push(`${fieldName} is required`);
    }

    if (value && config.minLength && value.trim().length < config.minLength) {
      fieldErrors.push(`${fieldName} must be at least ${config.minLength} characters long`);
    }

    if (value && config.maxLength && value.trim().length > config.maxLength) {
      fieldErrors.push(`${fieldName} must not exceed ${config.maxLength} characters`);
    }

    if (value && config.specialChars === false) {
      const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/;
      if (specialCharsRegex.test(value)) {
        fieldErrors.push(`${fieldName} cannot contain special characters`);
      }
    }

    // Additional validation for date and time
    if (fieldName === 'dueDate' && value) {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        fieldErrors.push('Due date cannot be in the past');
      }
    }

    return fieldErrors;
  };

  const validateAllFields = (taskData) => {
    const allErrors = {};
    
    Object.keys(validationConfig).forEach(fieldName => {
      const fieldErrors = validateField(fieldName, taskData[fieldName]);
      if (fieldErrors.length > 0) {
        allErrors[fieldName] = fieldErrors;
      }
    });

    // Cross-field validation for date and time
    if (taskData.dueDate && taskData.dueTime) {
      const taskDateTime = new Date(`${taskData.dueDate}T${taskData.dueTime}`);
      const now = new Date();
      
      if (taskDateTime <= now) {
        if (!allErrors.dueTime) allErrors.dueTime = [];
        allErrors.dueTime.push('Due date and time must be in the future');
      }
    }

    return allErrors;
  };

  const handleFieldChange = (fieldName, value, isEditing = false) => {
    const fieldErrors = validateField(fieldName, value);
    
    if (isEditing) {
      setEditErrors(prev => ({
        ...prev,
        [fieldName]: fieldErrors.length > 0 ? fieldErrors : undefined
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        [fieldName]: fieldErrors.length > 0 ? fieldErrors : undefined
      }));
    }
  };

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
  if (!user) return;

  const q = query(
    collection(db, 'tasks'),
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    if (!querySnapshot || querySnapshot.empty) {
      setTasks([]); // Set to empty if no tasks found
      setLoading(false);
      return;
    }

    const tasksData = [];
    querySnapshot.forEach((doc) => {
      tasksData.push({
        id: doc.id,
        ...doc.data()
      });
    });

    setTasks(tasksData);
    setLoading(false);
  });

  return () => unsubscribe();
}, [user]);


  const statusConfig = {
    'Not Started': { color: 'status-not-started', icon: '⏳' },
    'In Progress': { color: 'status-in-progress', icon: '🔄' },
    'Completed': { color: 'status-completed', icon: '✅' }
  };

  const priorityConfig = {
    'High': { color: 'priority-high', icon: '🔴' },
    'Medium': { color: 'priority-medium', icon: '🟡' },
    'Low': { color: 'priority-low', icon: '🟢' }
  };

  const addTask = async () => {
    // Validate all fields
    const validationErrors = validateAllFields(newTask);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return; // Don't submit if there are validation errors
    }

    try {
      const taskData = {
        ...newTask,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'tasks'), taskData);
      
      setNewTask({
        subject: '',
        description: '',
        dueDate: '',
        dueTime: '',
        status: 'Not Started',
        priority: 'Medium'
      });
      setErrors({});
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const updateTask = async (taskId, updatedTask) => {
    // Validate all fields for editing
    const validationErrors = validateAllFields(updatedTask);
    setEditErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return; // Don't submit if there are validation errors
    }

    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...updatedTask,
        updatedAt: new Date().toISOString()
      });
      setEditingTask(null);
      setEditErrors({});
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isTaskOverdue = (task) => {
    const taskDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
    return taskDateTime < currentTime && task.status !== 'Completed';
  };

  const getTimeFilteredTasks = (tasks) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    switch (timeFilter) {
      case 'Today':
        return tasks.filter(task => {
          const taskDate = new Date(task.dueDate);
          return taskDate.toDateString() === today.toDateString();
        });
      case 'Tomorrow':
        return tasks.filter(task => {
          const taskDate = new Date(task.dueDate);
          return taskDate.toDateString() === tomorrow.toDateString();
        });
      case 'This Week':
        return tasks.filter(task => {
          const taskDate = new Date(task.dueDate);
          return taskDate >= today && taskDate <= nextWeek;
        });
      case 'Overdue':
        return tasks.filter(task => isTaskOverdue(task));
      default:
        return tasks;
    }
  };

  const filteredTasks = getTimeFilteredTasks(
    tasks.filter(task => filter === 'All' || task.status === filter)
  );

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        return new Date(`${a.dueDate}T${a.dueTime}`) - new Date(`${b.dueDate}T${b.dueTime}`);
      case 'priority':
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'status':
        return a.status.localeCompare(b.status);
      case 'created':
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return 0;
    }
  });

  const getTaskCounts = () => {
    return {
      total: tasks.length,
      notStarted: tasks.filter(t => t.status === 'Not Started').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      overdue: tasks.filter(t => isTaskOverdue(t)).length
    };
  };

  const counts = getTaskCounts();

  const formatDateTime = (date, time) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString();
  };

  const getTimeRemaining = (task) => {
    const taskDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
    const now = new Date();
    const diff = taskDateTime - now;
    
    if (diff < 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Error display component
  const ErrorDisplay = ({ errors }) => {
    if (!errors || errors.length === 0) return null;
    
    return (
      <div className="error-messages">
        {errors.map((error, index) => (
          <div key={index} className="error-message">
            ⚠️ {error}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🔄</div>
        <p>Loading your tasks...</p>
      </div>
    );
  }

  return (
    <div className="todo-app">
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="header-content">
            <div>
              <h1>Task Manager Pro</h1>
              <p>Welcome back, {user.displayName || user.email}!</p>
            </div>
            <div className="header-actions">
              <div className="current-time">
                <span className="time-icon">🕐</span>
                {currentTime.toLocaleString()}
              </div>
              <button onClick={handleSignOut} className="sign-out-btn">
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-number">{counts.total}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card not-started">
            <div className="stat-number">{counts.notStarted}</div>
            <div className="stat-label">Not Started</div>
          </div>
          <div className="stat-card in-progress">
            <div className="stat-number">{counts.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card completed">
            <div className="stat-number">{counts.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card overdue">
            <div className="stat-number">{counts.overdue}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>

        {/* Add Task Form */}
        <div className="add-task-form">
          <h2>📝 Add New Task</h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Subject <span className="required">*</span></label>
              <input
                type="text"
                value={newTask.subject}
                onChange={(e) => {
                  setNewTask({...newTask, subject: e.target.value});
                  handleFieldChange('subject', e.target.value);
                }}
                placeholder="Enter task subject... (3-100 characters, no special characters)"
                className={errors.subject ? 'error' : ''}
                maxLength="100"
              />
              <div className="field-info">
                {newTask.subject.length}/100 characters
              </div>
              <ErrorDisplay errors={errors.subject} />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => {
                  setNewTask({...newTask, description: e.target.value});
                  handleFieldChange('description', e.target.value);
                }}
                placeholder="Enter task description... (max 500 characters)"
                rows="3"
                className={errors.description ? 'error' : ''}
                maxLength="500"
              />
              <div className="field-info">
                {newTask.description.length}/500 characters
              </div>
              <ErrorDisplay errors={errors.description} />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Due Date <span className="required">*</span></label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => {
                    setNewTask({...newTask, dueDate: e.target.value});
                    handleFieldChange('dueDate', e.target.value);
                  }}
                  className={errors.dueDate ? 'error' : ''}
                  min={new Date().toISOString().split('T')[0]}
                />
                <ErrorDisplay errors={errors.dueDate} />
              </div>
              
              <div className="form-group">
                <label>Due Time <span className="required">*</span></label>
                <input
                  type="time"
                  value={newTask.dueTime}
                  onChange={(e) => {
                    setNewTask({...newTask, dueTime: e.target.value});
                    handleFieldChange('dueTime', e.target.value);
                  }}
                  className={errors.dueTime ? 'error' : ''}
                />
                <ErrorDisplay errors={errors.dueTime} />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            
            <button onClick={addTask} className="add-button">
              ➕ Add Task
            </button>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Status Filter:</label>
            <div className="filter-buttons">
              {['All', 'Not Started', 'In Progress', 'Completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`filter-btn ${filter === status ? 'active' : ''}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Time Filter:</label>
            <div className="filter-buttons">
              {['All', 'Today', 'Tomorrow', 'This Week', 'Overdue'].map(timeF => (
                <button
                  key={timeF}
                  onClick={() => setTimeFilter(timeF)}
                  className={`filter-btn ${timeFilter === timeF ? 'active' : ''}`}
                >
                  {timeF}
                </button>
              ))}
            </div>
          </div>

          <div className="sort-group">
            <label>Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="created">Created Date</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        <div className="tasks-section">
          {sortedTasks.length === 0 ? (
            <div className="no-tasks">
              <div className="no-tasks-icon">📋</div>
              <p>No tasks found for the selected filters.</p>
            </div>
          ) : (
            sortedTasks.map(task => {
              const isEditing = editingTask?.id === task.id;
              const isOverdue = isTaskOverdue(task);
              
              return (
                <div key={task.id} className={`task-card ${isOverdue ? 'overdue' : ''}`}>
                  {isEditing ? (
                    <div className="edit-form">
                      <div className="form-group">
                        <label>Subject <span className="required">*</span></label>
                        <input
                          type="text"
                          value={editingTask.subject}
                          onChange={(e) => {
                            setEditingTask({...editingTask, subject: e.target.value});
                            handleFieldChange('subject', e.target.value, true);
                          }}
                          className={`edit-input ${editErrors.subject ? 'error' : ''}`}
                          maxLength="100"
                        />
                        <div className="field-info">
                          {editingTask.subject.length}/100 characters
                        </div>
                        <ErrorDisplay errors={editErrors.subject} />
                      </div>
                      
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          value={editingTask.description}
                          onChange={(e) => {
                            setEditingTask({...editingTask, description: e.target.value});
                            handleFieldChange('description', e.target.value, true);
                          }}
                          className={`edit-textarea ${editErrors.description ? 'error' : ''}`}
                          rows="3"
                          maxLength="500"
                        />
                        <div className="field-info">
                          {editingTask.description.length}/500 characters
                        </div>
                        <ErrorDisplay errors={editErrors.description} />
                      </div>
                      
                      <div className="edit-row">
                        <div className="form-group">
                          <label>Due Date <span className="required">*</span></label>
                          <input
                            type="date"
                            value={editingTask.dueDate}
                            onChange={(e) => {
                              setEditingTask({...editingTask, dueDate: e.target.value});
                              handleFieldChange('dueDate', e.target.value, true);
                            }}
                            className={`edit-input ${editErrors.dueDate ? 'error' : ''}`}
                            min={new Date().toISOString().split('T')[0]}
                          />
                          <ErrorDisplay errors={editErrors.dueDate} />
                        </div>
                        
                        <div className="form-group">
                          <label>Due Time <span className="required">*</span></label>
                          <input
                            type="time"
                            value={editingTask.dueTime}
                            onChange={(e) => {
                              setEditingTask({...editingTask, dueTime: e.target.value});
                              handleFieldChange('dueTime', e.target.value, true);
                            }}
                            className={`edit-input ${editErrors.dueTime ? 'error' : ''}`}
                          />
                          <ErrorDisplay errors={editErrors.dueTime} />
                        </div>
                      </div>
                      
                      <div className="edit-row">
                        <select
                          value={editingTask.status}
                          onChange={(e) => setEditingTask({...editingTask, status: e.target.value})}
                          className="edit-select"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                        <select
                          value={editingTask.priority}
                          onChange={(e) => setEditingTask({...editingTask, priority: e.target.value})}
                          className="edit-select"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                      
                      <div className="edit-actions">
                        <button
                          onClick={() => updateTask(task.id, editingTask)}
                          className="save-btn"
                        >
                          💾 Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingTask(null);
                            setEditErrors({});
                          }}
                          className="cancel-btn"
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="task-content">
                      <div className="task-header">
                        <h3>{task.subject}</h3>
                        <div className="task-actions">
                          <button
                            onClick={() => setEditingTask(task)}
                            className="edit-btn"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="delete-btn"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      <p className="task-description">{task.description}</p>
                      
                      <div className="task-meta">
                        <div className="task-datetime">
                          <span className="datetime-icon">📅</span>
                          <span>{formatDateTime(task.dueDate, task.dueTime)}</span>
                        </div>
                        
                        <div className="task-time-remaining">
                          <span className="time-icon">⏱️</span>
                          <span className={isOverdue ? 'overdue-text' : ''}>
                            {getTimeRemaining(task)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="task-badges">
                        <div className={`status-badge ${statusConfig[task.status].color}`}>
                          <span>{statusConfig[task.status].icon}</span>
                          <span>{task.status}</span>
                        </div>
                        
                        <div className={`priority-badge ${priorityConfig[task.priority].color}`}>
                          <span>{priorityConfig[task.priority].icon}</span>
                          <span>{task.priority}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="footer">
          <p>
            Showing {sortedTasks.length} of {tasks.length} tasks
          </p>
        </div>
      </div>
    </div>
  );
};

export default TodoApp;