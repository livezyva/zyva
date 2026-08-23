import './globals.css';
import 'leaflet/dist/leaflet.css';

export const metadata = {
  title: 'ZYVA — Tonight in Cyprus',
  description: 'Discover nightlife, dining, festivals, beach bars and cultural pop-ups happening now across Cyprus. Limassol, Nicosia, Paphos, Larnaca, Ayia Napa.',
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'ZYVA — Tonight in Cyprus',
    description: 'The pulse of Cyprus nightlife & culture.',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zbg text-ztext min-h-screen">
        {children}
      </body>
    </html>
  );
}
