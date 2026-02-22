import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Server, 
  Cpu, 
  Network, 
  Users, 
  Package, 
  Database, 
  FileText, 
  Settings, 
  LogOut, 
  Plus, 
  Activity,
  Terminal,
  Shield,
  Search,
  ChevronRight,
  Menu,
  X,
  RefreshCw,
  Power,
  Trash2,
  HardDrive,
  Globe
} from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import { DashboardStats, Node, Container, User, PortForward, Package as VpsPackage } from './types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active?: boolean }) => (
  <Link 
    to={to} 
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
      active ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
    )}
  >
    <Icon size={20} className={cn(active ? "text-white" : "text-slate-500 group-hover:text-blue-400")} />
    <span className="font-medium">{label}</span>
  </Link>
);

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
  <div className="card p-6 flex items-center justify-between">
    <div>
      <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
      <h3 className="text-3xl font-bold">{value}</h3>
    </div>
    <div className={cn("p-3 rounded-xl", color)}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

// --- Pages ---

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError('Connection error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-600/20">
            <Server size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">RPX PANEL</h1>
          <p className="text-slate-500 mt-2">Enterprise LXC Control Panel</p>
        </div>
        
        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
            <input 
              type="text" 
              className="input-field" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full py-3 text-lg">Sign In</button>
        </form>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(setStats);
  }, [token]);

  const mockData = [
    { name: '00:00', cpu: 20, ram: 45 },
    { name: '04:00', cpu: 35, ram: 48 },
    { name: '08:00', cpu: 65, ram: 55 },
    { name: '12:00', cpu: 45, ram: 60 },
    { name: '16:00', cpu: 80, ram: 75 },
    { name: '20:00', cpu: 55, ram: 70 },
    { name: '23:59', cpu: 30, ram: 65 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <div className="text-slate-400 text-sm flex items-center gap-2">
          <Activity size={16} className="text-emerald-500" />
          System Status: Online
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Containers" value={stats?.containers || 0} icon={Cpu} color="bg-blue-600" />
        <StatCard label="Active VPS" value={stats?.active || 0} icon={Activity} color="bg-emerald-600" />
        <StatCard label="Total Nodes" value={stats?.nodes || 0} icon={Server} color="bg-indigo-600" />
        <StatCard label="Total Users" value={stats?.users || 0} icon={Users} color="bg-violet-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Activity size={18} className="text-blue-500" />
            CPU Load (24h)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e24" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111114', border: '1px solid #1e1e24', borderRadius: '8px' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Database size={18} className="text-emerald-500" />
            RAM Usage (24h)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData}>
                <defs>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e24" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111114', border: '1px solid #1e1e24', borderRadius: '8px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="ram" stroke="#10b981" fillOpacity={1} fill="url(#colorRam)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const Containers = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();

  const fetchContainers = async () => {
    const res = await fetch('/api/containers', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setContainers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchContainers();
  }, [token]);

  const handleAction = async (id: number, action: string) => {
    const res = await fetch(`/api/containers/${id}/action`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ action })
    });
    if (res.ok) fetchContainers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Containers</h2>
          <p className="text-slate-400 text-sm mt-1">Manage your virtual private servers</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Create VPS
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-800/30 text-slate-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Resources</th>
              <th className="px-6 py-4 font-semibold">Node</th>
              {user?.role === 'admin' && <th className="px-6 py-4 font-semibold">Owner</th>}
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {containers.map(c => (
              <tr key={c.id} className="hover:bg-slate-800/20 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-blue-400">
                      <Cpu size={18} />
                    </div>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.os}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                    c.status === 'running' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", c.status === 'running' ? "bg-emerald-500" : "bg-red-500")} />
                    {c.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs space-y-1">
                    <p className="text-slate-300">{c.cpu} Cores / {c.ram}MB RAM</p>
                    <p className="text-slate-500">{c.disk}GB Disk</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{c.node_name}</td>
                {user?.role === 'admin' && <td className="px-6 py-4 text-sm text-slate-400">{c.owner_name}</td>}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {c.status === 'running' ? (
                      <button onClick={() => handleAction(c.id, 'stop')} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors" title="Stop">
                        <Power size={18} />
                      </button>
                    ) : (
                      <button onClick={() => handleAction(c.id, 'start')} className="p-2 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors" title="Start">
                        <Power size={18} />
                      </button>
                    )}
                    <button className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors" title="Console">
                      <Terminal size={18} />
                    </button>
                    <button className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors" title="Settings">
                      <Settings size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Nodes = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    fetch('/api/nodes', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(setNodes);
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Nodes</h2>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add Node
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nodes.map(n => (
          <div key={n.id} className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-500">
                  <Server size={20} />
                </div>
                <div>
                  <h3 className="font-bold">{n.name}</h3>
                  <p className="text-xs text-slate-500">{n.ip}</p>
                </div>
              </div>
              <span className={cn(
                "px-2 py-1 rounded text-[10px] font-bold uppercase",
                n.status === 'online' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
              )}>
                {n.status}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">CPU Load</span>
                <span className="text-slate-300">24%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[24%]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">RAM Usage</span>
                <span className="text-slate-300">4.2GB / 16GB</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[35%]" />
              </div>
            </div>

            <div className="pt-4 flex items-center gap-2">
              <button className="flex-1 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">Details</button>
              <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const NetworkPage = () => {
  const [forwards, setForwards] = useState<PortForward[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    fetch('/api/port-forwards', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(setForwards);
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Port Forwarding</h2>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add Rule
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-800/30 text-slate-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Container</th>
              <th className="px-6 py-4 font-semibold">Public Port</th>
              <th className="px-6 py-4 font-semibold">Private Port</th>
              <th className="px-6 py-4 font-semibold">Protocol</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {forwards.map(f => (
              <tr key={f.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4 font-medium">{f.container_name}</td>
                <td className="px-6 py-4 text-slate-300">{f.public_port}</td>
                <td className="px-6 py-4 text-slate-300">{f.private_port}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase">
                    {f.protocol}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#0a0a0b]">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#111114] border-r border-[#1e1e24] transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Server size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">RPX PANEL</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">v2.0 Enterprise</p>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
            <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
            <SidebarItem to="/containers" icon={Cpu} label="Containers" active={location.pathname === '/containers'} />
            <SidebarItem to="/nodes" icon={Server} label="Nodes" active={location.pathname === '/nodes'} />
            <SidebarItem to="/network" icon={Globe} label="Network" active={location.pathname === '/network'} />
            <SidebarItem to="/packages" icon={Package} label="Packages" active={location.pathname === '/packages'} />
            {user?.role === 'admin' && (
              <>
                <div className="px-4 pt-6 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Administration</div>
                <SidebarItem to="/users" icon={Users} label="Users" active={location.pathname === '/users'} />
                <SidebarItem to="/backups" icon={Database} label="Backups" active={location.pathname === '/backups'} />
                <SidebarItem to="/logs" icon={FileText} label="System Logs" active={location.pathname === '/logs'} />
              </>
            )}
          </nav>

          <div className="p-4 border-t border-[#1e1e24]">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-blue-400">
                {user?.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.username}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{user?.role}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-[#111114]/80 backdrop-blur-md border-bottom border-[#1e1e24] flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="relative hidden md:block">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="bg-slate-800/50 border border-slate-700/50 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              API Connected
            </div>
            <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
              <Activity size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#111114]" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Login />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/containers" element={<Containers />} />
        <Route path="/nodes" element={<Nodes />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/packages" element={<div className="card p-8 text-center text-slate-500">Packages Management coming soon</div>} />
        <Route path="/users" element={<div className="card p-8 text-center text-slate-500">Users Management coming soon</div>} />
        <Route path="/backups" element={<div className="card p-8 text-center text-slate-500">Backups Management coming soon</div>} />
        <Route path="/logs" element={<div className="card p-8 text-center text-slate-500">System Logs coming soon</div>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
