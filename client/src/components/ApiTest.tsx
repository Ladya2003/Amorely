import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const ApiTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Отправляем GET-запрос на корневой маршрут API
      const result = await axios.get(`${API_URL}/`);
      
      // Сохраняем ответ в состоянии
      setResponse(JSON.stringify(result.data, null, 2));
    } catch (err) {
      console.error('Ошибка при вызове API:', err);
      setError('Произошла ошибка при вызове API. Проверьте консоль для деталей.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2>Тест API</h2>
      
      <button 
        onClick={handleApiCall}
        disabled={loading}
        style={{
          padding: '10px 15px',
          backgroundColor: '#ff4b8d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {loading ? 'Загрузка...' : 'Отправить запрос на сервер'}
      </button>
      
      {error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#ffebee', 
          color: '#d32f2f',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
      
      {response && (
        <div style={{ marginTop: '20px' }}>
          <h3>Ответ сервера:</h3>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {response}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiTest; 