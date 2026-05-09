import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import ItemsPage from './pages/ItemsPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';
import ItemFormPage from './pages/ItemFormPage';

function App() {
  const token = useStore((s) => s.token);

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={token ? <MainLayout /> : <Navigate to="/login" />}>
        <Route index element={<HomePage />} />
        <Route path="items" element={<ItemsPage />} />
        <Route path="items/new" element={<ItemFormPage />} />
        <Route path="items/:id/edit" element={<ItemFormPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={token ? '/' : '/login'} />} />
    </Routes>
  );
}

export default App;
