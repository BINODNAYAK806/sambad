import React from 'react';
import ReactDOM from 'react-dom/client';
import ConsoleView from './renderer/components/ConsoleView';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConsoleView />
  </React.StrictMode>
);
