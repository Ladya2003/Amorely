import React from 'react';
import './App.css';
import ApiTest from './components/ApiTest';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Amorely</h1>
        <p>Приложение для влюбленных пар</p>
      </header>
      <main>
        <ApiTest />
      </main>
    </div>
  );
}

export default App;
