import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import ErrorBoundary from '@/components/ErrorBoundary';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  try {
    root.render(
      <>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </>
    );
  } catch (error) {
    console.error("Failed to render application:", error);
    root.render(
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Something went wrong</h1>
        <p>The application failed to start. Please try refreshing the page.</p>
        <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
          {error.message}
        </pre>
      </div>
    );
  }
} else {
  console.error("Root element not found");
}