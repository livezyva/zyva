import Header from '../../components/Header';
import SavedClient from './SavedClient';

export const metadata = { title: 'Saved — ZYVA' };

export default function SavedPage() {
  return (
    <div className="min-h-screen bg-zbg">
      <Header />
      <SavedClient />
    </div>
  );
}
