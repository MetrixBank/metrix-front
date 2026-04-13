import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/index.css';
import { isSupabaseConfigured } from '@/lib/customSupabaseClient';

function MissingSupabaseEnv() {
	return (
		<div
			style={{
				padding: 32,
				fontFamily: 'system-ui, sans-serif',
				maxWidth: 560,
				margin: '0 auto',
				lineHeight: 1.6,
			}}
		>
			<h1 style={{ marginBottom: 16 }}>Configuração necessária</h1>
			<p style={{ color: '#94a3b8' }}>
				Defina <code style={{ color: '#e2e8f0' }}>VITE_SUPABASE_URL</code> e uma chave pública:{' '}
				<code style={{ color: '#e2e8f0' }}>VITE_SUPABASE_ANON_KEY</code> ou{' '}
				<code style={{ color: '#e2e8f0' }}>VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY</code> no{' '}
				<code style={{ color: '#e2e8f0' }}>.env</code> na raiz e reinicie o{' '}
				<code style={{ color: '#e2e8f0' }}>npm run dev</code>.
			</p>
		</div>
	);
}

const rootElement = document.getElementById('root');

if (!rootElement) {
	console.error('Root element not found');
} else {
	const root = ReactDOM.createRoot(rootElement);
	if (!isSupabaseConfigured) {
		root.render(<MissingSupabaseEnv />);
	} else {
		import('./bootstrap.jsx').then(({ mountApp }) => mountApp(root));
	}
}
