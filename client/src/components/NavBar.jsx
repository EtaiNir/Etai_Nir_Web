// client/src/components/NavBar.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex justify-between items-center">
      <Link to="/" className="font-bold text-lg">מצבת תלמידים</Link>
      <div className="flex gap-4 items-center text-sm">
        {user?.role === 'admin' && <Link to="/admin">ניהול משתמשים</Link>}
        <button onClick={logout} className="hover:underline">יציאה</button>
      </div>
    </nav>
  );
}
