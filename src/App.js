// App.js
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './components/firebase';
import AuthComponent from './components/AuthComponent';
import TodoApp from './components/TodoApp';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (user) => {
    setUser(user);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">🔄</div>
        <p>Loading Task Manager Pro...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {user ? (
        <TodoApp user={user} />
      ) : (
        <AuthComponent onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}

export default App;