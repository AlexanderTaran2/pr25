import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function App() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newTodo, setNewTodo] = useState({ title: '', description: '' });

  // Настройка axios для отправки токена
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(localStorage.getItem('user')));
      fetchTodos();
    }
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/todos`);
      setTodos(response.data);
    } catch (err) {
      setError('Ошибка загрузки задач');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/register`, {
        email: formData.get('email'),
        password: formData.get('password')
      });
      alert('Регистрация успешна! Теперь войдите в систему.');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: formData.get('email'),
        password: formData.get('password')
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      fetchTodos();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setTodos([]);
  };

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/todos`, newTodo);
      setTodos([response.data, ...todos]);
      setNewTodo({ title: '', description: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания задачи');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTodo = async (id, completed) => {
    try {
      const response = await axios.put(`${API_URL}/todos/${id}`, { completed });
      setTodos(todos.map(todo => todo.id === id ? response.data : todo));
    } catch (err) {
      setError('Ошибка обновления задачи');
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await axios.delete(`${API_URL}/todos/${id}`);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err) {
      setError('Ошибка удаления задачи');
    }
  };

  if (!user) {
    return (
      <div className="App">
        <div className="auth-container">
          <div className="auth-form">
            <h2>Вход</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleLogin}>
              <input type="email" name="email" placeholder="Email" required />
              <input type="password" name="password" placeholder="Пароль" required />
              <button type="submit" disabled={loading}>
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </form>
          </div>

          <div className="auth-form">
            <h2>Регистрация</h2>
            <form onSubmit={handleRegister}>
              <input type="email" name="email" placeholder="Email" required />
              <input type="password" name="password" placeholder="Пароль" required />
              <button type="submit" disabled={loading}>
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Todo App</h1>
        <div className="user-info">
          <span>Привет, {user.email}</span>
          <button onClick={handleLogout}>Выйти</button>
        </div>
      </header>

      <div className="todo-container">
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleCreateTodo} className="todo-form">
          <input
            type="text"
            placeholder="Название задачи"
            value={newTodo.title}
            onChange={(e) => setNewTodo({...newTodo, title: e.target.value})}
            required
          />
          <textarea
            placeholder="Описание (необязательно)"
            value={newTodo.description}
            onChange={(e) => setNewTodo({...newTodo, description: e.target.value})}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Добавление...' : 'Добавить задачу'}
          </button>
        </form>

        <div className="todos-list">
          <h2>Мои задачи ({todos.length})</h2>
          {loading && <div className="loading">Загрузка...</div>}
          {todos.map(todo => (
            <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <div className="todo-content">
                <h3>{todo.title}</h3>
                {todo.description && <p>{todo.description}</p>}
                <small>Создано: {new Date(todo.created_at).toLocaleDateString()}</small>
              </div>
              <div className="todo-actions">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={(e) => handleUpdateTodo(todo.id, e.target.checked)}
                />
                <button onClick={() => handleDeleteTodo(todo.id)}>Удалить</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;