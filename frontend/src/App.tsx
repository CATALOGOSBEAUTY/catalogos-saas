import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginView } from './modules/auth/LoginView';
import { ClientDashboard } from './modules/client-dashboard/ClientDashboard';
import { MarketingHome } from './modules/marketing/MarketingHome';
import { MasterDashboard } from './modules/master/MasterDashboard';
import { PublicStore } from './modules/public-store/PublicStore';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketingHome />} />
      <Route path="/loja/:companySlug/*" element={<PublicStore />} />
      <Route path="/login" element={<Navigate to="/cliente/login" replace />} />
      <Route path="/cliente/login" element={<LoginView mode="client" />} />
      <Route path="/master/login" element={<LoginView mode="master" />} />
      <Route path="/app/*" element={<Navigate to="/cliente/app/dashboard" replace />} />
      <Route path="/cliente/app/*" element={<ClientDashboard />} />
      <Route path="/master" element={<Navigate to="/master/app/dashboard" replace />} />
      <Route path="/master/app/*" element={<MasterDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
