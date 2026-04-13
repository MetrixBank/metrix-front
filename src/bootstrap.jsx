import React from 'react';
import App from '@/App';
import ErrorBoundary from '@/components/ErrorBoundary';

export function mountApp(root) {
	try {
		root.render(
			<>
				<ErrorBoundary>
					<App />
				</ErrorBoundary>
			</>
		);
	} catch (error) {
		console.error('Failed to render application:', error);
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
}
