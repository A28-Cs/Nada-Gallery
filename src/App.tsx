import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgb(var(--color-surface))',
            color: 'rgb(var(--color-foreground))',
            border: '1px solid rgb(var(--color-border))',
            borderRadius: '8px',
            boxShadow: '0 18px 60px rgb(0 0 0 / 0.12)',
          },
          success: {
            iconTheme: {
              primary: 'rgb(var(--color-foreground))',
              secondary: 'rgb(var(--color-background))',
            },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </>
  );
}
