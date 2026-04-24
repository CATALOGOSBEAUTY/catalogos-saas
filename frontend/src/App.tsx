import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginView } from './modules/auth/LoginView';
import { ClientDashboard } from './modules/client-dashboard/ClientDashboard';
import { MasterDashboard } from './modules/master/MasterDashboard';
import { PublicStore } from './modules/public-store/PublicStore';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/loja/pulsefit/catalogo" replace />} />
      <Route path="/loja/:companySlug/*" element={<PublicStore />} />
      <Route path="/login" element={<LoginView />} />
      <Route path="/app/*" element={<ClientDashboard />} />
      <Route path="/master/*" element={<MasterDashboard />} />
      <Route path="*" element={<Navigate to="/loja/pulsefit/catalogo" replace />} />
    </Routes>
  );
}
