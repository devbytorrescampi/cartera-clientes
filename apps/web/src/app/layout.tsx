import type { Metadata, Viewport } from 'next';
import './globals.css';

// Se ejecuta antes de que cargue React: aplica el tema elegido (para que no parpadee) y guarda
// el evento de instalación de Chrome si llega antes de que la app pueda escucharlo.
const SCRIPT_INICIAL = `try{var t=localStorage.getItem('tcshop:tema');if(t==='claro'||t==='oscuro')document.documentElement.dataset.tema=t}catch(e){}
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__eventoInstalar=e});`;

export const metadata: Metadata = {
  title: 'Relevamiento TCShop',
  description: 'Registro de comercios visitados y seguimiento de interesados',
  applicationName: 'TCShop',
  appleWebApp: { capable: true, title: 'TCShop', statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/iconos/icono.svg', type: 'image/svg+xml' }],
    apple: '/iconos/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0d10' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_INICIAL }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
