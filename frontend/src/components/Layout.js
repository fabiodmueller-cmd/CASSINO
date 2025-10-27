import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserCog, MapPin, Monitor, FileText, BarChart3, Settings, LogOut, Menu, X, Link2 } from 'lucide-react';
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
    { path: '/settings', label: 'Configurações', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logout realizado com sucesso!');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 text-white"
        data-testid="mobile-menu-toggle"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-gradient-to-b from-blue-900 to-indigo-900 border-r-2 border-yellow-500
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b-2 border-yellow-500/30">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400">
            SlotManager
          </h1>
          <p className="text-sm text-blue-200 mt-1">Gestão de Caça-Níqueis</p>
        </div>
        <nav className="px-4 space-y-2 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const colors = {
              '/': 'from-blue-400 to-cyan-400',
              '/clients': 'from-purple-400 to-pink-400',
              '/operators': 'from-green-400 to-emerald-400',
              '/regions': 'from-orange-400 to-red-400',
              '/machines': 'from-yellow-400 to-amber-400',
              '/readings': 'from-indigo-400 to-purple-400',
              '/reports': 'from-pink-400 to-rose-400',
              '/settings': 'from-slate-400 to-gray-400',
            };
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 shadow-lg shadow-yellow-400/50 scale-105'
                    : 'text-blue-100 hover:bg-blue-800/50 hover:scale-105'
                }`}
              >
                <div className={`${!isActive && `text-transparent bg-clip-text bg-gradient-to-r ${colors[item.path]}`}`}>
                  <Icon size={20} />
                </div>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-all hover:scale-105 border-2 border-red-400/30 hover:border-red-400"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
