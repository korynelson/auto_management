import { useState, useEffect, createContext, useContext } from 'react';

const ThemeContext = createContext(null);

const defaultThemes = {
  purple: {
    name: 'Purple Dream',
    primary: '#667eea',
    secondary: '#764ba2',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  blue: {
    name: 'Ocean Blue',
    primary: '#2196F3',
    secondary: '#1976D2',
    gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
  },
  green: {
    name: 'Forest Green',
    primary: '#4CAF50',
    secondary: '#388E3C',
    gradient: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
  },
  orange: {
    name: 'Sunset Orange',
    primary: '#FF9800',
    secondary: '#F57C00',
    gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
  },
  red: {
    name: 'Cherry Red',
    primary: '#f44336',
    secondary: '#d32f2f',
    gradient: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
  },
  dark: {
    name: 'Midnight Dark',
    primary: '#424242',
    secondary: '#212121',
    gradient: 'linear-gradient(135deg, #424242 0%, #212121 100%)'
  }
};

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('purple');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('carMaintenanceTheme');
    if (savedTheme && defaultThemes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      // Apply theme CSS variables
      const theme = defaultThemes[currentTheme];
      document.documentElement.style.setProperty('--theme-primary', theme.primary);
      document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
      document.documentElement.style.setProperty('--theme-gradient', theme.gradient);
      
      // Save to localStorage
      localStorage.setItem('carMaintenanceTheme', currentTheme);
    }
  }, [currentTheme, isLoaded]);

  const setTheme = (themeKey) => {
    if (defaultThemes[themeKey]) {
      setCurrentTheme(themeKey);
    }
  };

  const value = {
    currentTheme,
    theme: defaultThemes[currentTheme],
    themes: defaultThemes,
    setTheme,
    isLoaded
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
