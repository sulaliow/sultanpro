
import React, { useState, useEffect } from 'react';
import { 
  LogIn, 
  LogOut, 
  Calendar, 
  Clock, 
  BarChart3, 
  LayoutDashboard, 
  UserPlus, 
  Trash2, 
  Edit, 
  ChevronLeft,
  ShieldCheck,
  AlertCircle,
  FileText,
  Sparkles,
  X,
  Sun,
  Moon,
  AlertTriangle
} from 'lucide-react';
import { User, AttendanceRecord, UserRole } from './types';
import { generateAttendanceInsights } from './services/geminiService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

const INITIAL_USERS: User[] = [
  { id: '1', username: 'admin', fullName: 'مدير الموارد البشرية', role: 'admin', password: 'password', department: 'الموارد البشرية', joinedAt: '2023-01-01' },
  { id: '2', username: 'jdoe', fullName: 'أحمد علي', role: 'employee', password: 'password', department: 'الهندسة', joinedAt: '2023-05-15' },
  { id: '3', username: 'asmith', fullName: 'سارة خالد', role: 'employee', password: 'password', department: 'التصميم', joinedAt: '2023-06-20' },
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 'r1', userId: '2', date: '2024-05-20', checkIn: '09:05:00', checkOut: '18:10:00', status: 'present' },
  { id: 'r2', userId: '3', date: '2024-05-20', checkIn: '09:15:00', checkOut: '18:00:00', status: 'present' },
];

const App: React.FC = () => {
  const [view, setView] = useState<'login' | 'dashboard' | 'admin'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('tros_theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('tros_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('tros_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    username: '',
    department: 'الهندسة',
    role: 'employee' as UserRole,
    password: ''
  });

  useEffect(() => {
    localStorage.setItem('tros_users', JSON.stringify(users));
    localStorage.setItem('tros_attendance', JSON.stringify(attendance));
  }, [users, attendance]);

  useEffect(() => {
    localStorage.setItem('tros_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      setView(user.role === 'admin' ? 'admin' : 'dashboard');
      setError('');
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
    setUsername('');
    setPassword('');
  };

  const checkIn = () => {
    if (!currentUser) return;
    const now = new Date();
    const newRecord: AttendanceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      date: now.toISOString().split('T')[0],
      checkIn: now.toLocaleTimeString('ar-EG'),
      checkOut: null,
      status: now.getHours() >= 9 && now.getMinutes() > 0 ? 'late' : 'present',
    };
    setAttendance([...attendance, newRecord]);
  };

  const checkOut = () => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    const record = attendance.find(r => r.userId === currentUser.id && r.date === today && !r.checkOut);
    if (record) {
      const updated = attendance.map(r => 
        r.id === record.id ? { ...r, checkOut: new Date().toLocaleTimeString('ar-EG') } : r
      );
      setAttendance(updated);
    }
  };

  const generateReport = async () => {
    setIsGeneratingAi(true);
    const report = await generateAttendanceInsights(users, attendance);
    setAiReport(report);
    setIsGeneratingAi(false);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.fullName || !newUserForm.username || !newUserForm.password) return;

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: newUserForm.username,
      fullName: newUserForm.fullName,
      role: newUserForm.role,
      password: newUserForm.password,
      department: newUserForm.department,
      joinedAt: new Date().toISOString().split('T')[0],
    };

    setUsers([...users, newUser]);
    setIsUserModalOpen(false);
    setNewUserForm({ fullName: '', username: '', department: 'الهندسة', role: 'employee', password: '' });
  };

  const initiateDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setAttendance(attendance.filter(r => r.userId !== userToDelete.id));
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const todayRecord = currentUser ? attendance.find(r => r.userId === currentUser.id && r.date === new Date().toISOString().split('T')[0]) : null;

  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-10 border border-slate-100 dark:border-slate-800 relative">
          <button 
            onClick={toggleTheme}
            className="absolute top-6 left-6 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ShieldCheck className="text-white w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">بوابة تروس</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">مرحباً بك مجدداً! يرجى إدخال بياناتك.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">اسم المستخدم</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" placeholder="مثال: ahmed123" value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">كلمة المرور</label>
              <input type="password" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"><AlertCircle size={16} /><span>{error}</span></div>}
            <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-md">تسجيل الدخول</button>
          </form>
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center"><p className="text-xs text-slate-400 dark:text-slate-500">© 2024 حلول تروس للحضور والانصراف.</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300">
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md"><ShieldCheck className="text-white w-6 h-6" /></div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">تروس</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {currentUser?.role === 'admin' ? (
            <>
              <button onClick={() => setView('admin')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${view === 'admin' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><LayoutDashboard size={18} /> لوحة التحكم</button>
              <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Clock size={18} /> سجل حضوري</button>
            </>
          ) : (
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"><Clock size={18} /> سجل حضوري</button>
          )}
        </nav>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-sm"><img src={`https://picsum.photos/seed/${currentUser?.id}/40/40`} alt="Avatar" /></div>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{currentUser?.fullName}</p><p className="text-xs text-slate-500 dark:text-slate-400">{currentUser?.role === 'admin' ? 'مدير' : 'موظف'}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={toggleTheme} className="flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}{theme === 'light' ? 'ليلي' : 'نهاري'}</button>
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><LogOut size={16} /> خروج</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-10 max-w-7xl mx-auto">
          {view === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">بوابة الحضور</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:scale-110 transition-transform dark:text-blue-400"><Clock size={80} /></div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> الحالة الحالية</h3>
                  {!todayRecord ? (
                    <div className="space-y-4">
                      <p className="text-slate-600 dark:text-slate-400">لم تقم بتسجيل الدخول بعد لهذا اليوم.</p>
                      <button onClick={checkIn} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg">تسجيل حضور الآن</button>
                    </div>
                  ) : todayRecord.checkOut ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-2xl border border-green-100 dark:border-green-800 flex items-center gap-3"><Clock size={20} /><span className="font-semibold">اكتملت الوردية</span></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center"><p className="text-xs text-slate-500 dark:text-slate-500 uppercase tracking-wider font-bold mb-1">دخول</p><p className="text-lg font-bold text-slate-800 dark:text-white">{todayRecord.checkIn}</p></div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center"><p className="text-xs text-slate-500 dark:text-slate-500 uppercase tracking-wider font-bold mb-1">خروج</p><p className="text-lg font-bold text-slate-800 dark:text-white">{todayRecord.checkOut}</p></div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-center gap-3 animate-pulse"><div className="w-2 h-2 rounded-full bg-blue-600"></div><span className="font-semibold">الوردية جارية حالياً</span></div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4 text-center"><p className="text-xs text-slate-500 dark:text-slate-500 uppercase tracking-wider font-bold mb-1">وقت الدخول</p><p className="text-lg font-bold text-slate-800 dark:text-white">{todayRecord.checkIn}</p></div>
                      <button onClick={checkOut} className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-all flex items-center justify-center gap-2">تسجيل انصراف الآن</button>
                    </div>
                  )}
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">السجل الأخير</h3>
                  <div className="space-y-4 flex-1">
                    {attendance.filter(r => r.userId === currentUser?.id).slice(-4).reverse().map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><Calendar size={16} className="text-slate-600 dark:text-slate-400" /></div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{new Date(r.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</p>
                            <p className="text-xs text-slate-500 text-left" dir="ltr">{r.checkIn} - {r.checkOut || '--:--'}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${r.status === 'present' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'}`}>{r.status === 'present' ? 'حاضر' : 'متأخر'}</span>
                      </div>
                    ))}
                    {attendance.filter(r => r.userId === currentUser?.id).length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-400"><FileText size={40} className="mb-2 opacity-20" /><p className="text-sm">لا توجد سجلات بعد</p></div>}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4"><BarChart3 className="text-blue-600 dark:text-blue-400 w-10 h-10" /></div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">درجة الانضباط</h3>
                  <p className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">92%</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">أداء رائع! واصل الانضباط.</p>
                </div>
              </div>
            </div>
          )}

          {view === 'admin' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white">مركز تحكم الإدارة</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة الموظفين ومراجعة أداء المؤسسة.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={generateReport} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md">{isGeneratingAi ? <Sparkles size={18} className="animate-spin" /> : <Sparkles size={18} />} تحليل الذكاء الاصطناعي</button>
                  <button onClick={() => setIsUserModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-lg"><UserPlus size={18} /> إضافة عضو</button>
                </div>
              </header>

              {aiReport && (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 p-8 opacity-20 rotate-12"><Sparkles size={120} /></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4"><Sparkles size={20} /><h3 className="text-xl font-bold">تحليل الحضور الذكي</h3></div>
                    <div className="prose prose-invert max-w-none"><p className="whitespace-pre-line text-blue-50 leading-relaxed font-medium">{aiReport}</p></div>
                    <button onClick={() => setAiReport(null)} className="mt-6 text-sm text-blue-200 hover:text-white transition-colors flex items-center gap-1">إخفاء التحليلات <ChevronLeft size={14} className="mr-1" /></button>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 dark:text-white">دليل الموظفين</h3>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{users.length} إجمالي الموظفين</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">الموظف</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">القسم</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-left">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner"><img src={`https://picsum.photos/seed/${u.id}/40/40`} alt="Avatar" /></div>
                              <div><p className="text-sm font-semibold text-slate-900 dark:text-white">{u.fullName}</p><p className="text-xs text-slate-500 dark:text-slate-400" dir="ltr">@{u.username}</p></div>
                            </div>
                          </td>
                          <td className="px-6 py-4"><span className="text-sm text-slate-600 dark:text-slate-400">{u.department}</span></td>
                          <td className="px-6 py-4 text-left">
                            <div className="flex items-center justify-start gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"><Edit size={16} /></button>
                              {u.id !== currentUser?.id && <button onClick={() => initiateDeleteUser(u)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"><Trash2 size={16} /></button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3"><div className="p-2 bg-blue-600 rounded-xl text-white"><UserPlus size={20} /></div><h3 className="text-xl font-bold text-slate-900 dark:text-white">إضافة موظف جديد</h3></div>
              <button onClick={() => setIsUserModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2"><label className="text-sm font-bold text-slate-700 dark:text-slate-300">الاسم الكامل</label><input type="text" required className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none text-right" value={newUserForm.fullName} onChange={e => setNewUserForm({...newUserForm, fullName: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-slate-700 dark:text-slate-300">اسم المستخدم</label><input type="text" required className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none text-right" value={newUserForm.username} onChange={e => setNewUserForm({...newUserForm, username: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><label className="text-sm font-bold text-slate-700 dark:text-slate-300">كلمة المرور</label><input type="password" required className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none text-right" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2"><label className="text-sm font-bold text-slate-700 dark:text-slate-300">القسم</label><select className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none appearance-none text-right" value={newUserForm.department} onChange={e => setNewUserForm({...newUserForm, department: e.target.value})}><option value="الهندسة">الهندسة</option><option value="التصميم">التصميم</option><option value="الموارد البشرية">الموارد البشرية</option></select></div>
                <div className="space-y-2"><label className="text-sm font-bold text-slate-700 dark:text-slate-300">الدور الوظيفي</label><select className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none appearance-none text-right" value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value as UserRole})}><option value="employee">موظف</option><option value="admin">مدير نظام</option></select></div>
              </div>
              <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all">إلغاء</button><button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-2xl shadow-lg transition-all">حفظ الحساب</button></div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-8 text-center">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">تأكيد الحذف</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              هل أنت متأكد من رغبتك في حذف الموظف <span className="font-bold text-slate-900 dark:text-slate-100">"{userToDelete.fullName}"</span>؟ سيتم مسح كافة سجلات الحضور الخاصة به نهائياً ولا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDeleteUser}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-200 dark:shadow-none"
              >
                تأكيد الحذف النهائي
              </button>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
