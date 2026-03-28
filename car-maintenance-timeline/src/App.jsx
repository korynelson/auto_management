import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { ThemeProvider, useTheme } from './hooks/useTheme.jsx';
import { SignInForm, SignUpForm } from './components/AuthForms';
import { Dashboard } from './components/Dashboard';
import './App.css';

function AppContent() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: themeLoaded } = useTheme();
  const [showSignUp, setShowSignUp] = useState(false);

  if (!authLoaded || !themeLoaded) {
    return (
      <div className="app loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="app">
        <header className="header">
          <h1>Car Maintenance Timeline</h1>
          <p>Track your oil changes and fuel costs</p>
        </header>
        <main className="main">
          {showSignUp ? (
            <SignUpForm onToggle={() => setShowSignUp(false)} />
          ) : (
            <SignInForm onToggle={() => setShowSignUp(true)} />
          )}
        </main>
        <footer className="footer">
          <p>Secure authentication powered by Insforge</p>
        </footer>
      </div>
    );
  }

  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
