import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext.jsx';
import SmoothScrollLenis from './components/common/SmoothScrollLenis.jsx';
import AppLayout from './components/layout/AppLayout.jsx';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        const pagePromise = resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        );
        pagePromise.then((module) => {
            // Default layout if the page doesn't define one
            module.default.layout = module.default.layout || ((page) => <AppLayout children={page} />);
        });
        return pagePromise;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <AuthProvider>
                <SmoothScrollLenis>
                    <App {...props} />
                </SmoothScrollLenis>
            </AuthProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
