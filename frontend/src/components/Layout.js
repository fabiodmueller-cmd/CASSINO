import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserCog, MapPin, Monitor, FileText, BarChart3, LogOut, Menu, X } from 'lucide-react';
import { toast } from 'sonner';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/clients', label: 'Clientes', icon: Users },
    { path: '/operators', label: 'Operadores', icon: UserCog },
    { path: '/regions', label: 'Regiões', icon: MapPin },
    { path: '/machines', label: 'Máquinas', icon: Monitor },
    { path: '/readings', label: 'Leituras', icon: FileText },
    { path: '/reports', label: 'Relatórios', icon: BarChart3 },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logout realizado com sucesso!');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            SlotManager
          </h1>
          <p className="text-sm text-slate-400 mt-1">Gestão de Caça-Níqueis</p>
        </div>
        <nav className="px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
