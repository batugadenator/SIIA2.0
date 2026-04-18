import React from 'react';
import ReactDOM from 'react-dom/client';

import './design-system/styles';
import { AppProviders } from './providers/AppProviders';
import { App } from './app/App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<AppProviders>
			<App />
		</AppProviders>
	</React.StrictMode>,
);
