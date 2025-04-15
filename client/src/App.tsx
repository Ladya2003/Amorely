import React from 'react';
import './App.css';
import ApiTest from './components/ApiTest';
import CloudinaryUpload from './components/CloudinaryUpload';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Создаем тему с основным цветом приложения
const theme = createTheme({
  palette: {
    primary: {
      main: '#ff4b8d',
    },
    secondary: {
      main: '#4b7bff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <header className="App-header">
          <h1>Amorely</h1>
          <p>Приложение для влюбленных пар</p>
        </header>
        <main>
          <ApiTest />
          <CloudinaryUpload />
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
