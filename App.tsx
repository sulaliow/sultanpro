
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LogIn, 
  LogOut, 
  Users, 
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
  User as UserIcon
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

// Initial Mock Data in Arabic
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
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('tros_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('tros_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // AI Insights State
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Add User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
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
    if (!newUserForm.fullName || !newUserForm.username || !newUserForm.password) {
      alert("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }

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
    setNewUserForm({
      fullName: '',
      username: '',
      department: 'الهندسة',
      role: 'employee',
      password: ''
    });
  };

  const deleteUser = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الموظف؟ سيتم حذف جميع سجلات الحضور الخاصة به أيضاً.")) {
      setUsers(users.filter(u => u.id !== id));
      setAttendance(attendance.filter(r => r.userId !== id));
    }
  };

  const todayRecord = currentUser ? attendance.find(r => r.userId === currentUser.id && r.date === new Date().toISOString().split('T')[0]) : null;

  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ShieldCheck className="text-white w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">بوابة تروس</h1>
            <p className="text-slate-500 mt-2">مرحباً بك مجدداً! يرجى إدخال بياناتك.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">اسم المستخدم</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right"
                placeholder="مثال: ahmed123"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">كلمة المرور</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-md shadow-blue-200">
              تسجيل الدخول
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">© 2024 حلول تروس للحضور والانصراف. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-l border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight uppercase">تروس</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {currentUser?.role === 'admin' ? (
            <>
              <button 
                onClick={() => setView('admin')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${view === 'admin' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <LayoutDashboard size={18} /> لوحة التحكم
              </button>
              <button 
                onClick={() => setView('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Clock size={18} /> سجل حضوري
              </button>
            </>
          ) : (
            <button 
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-blue-50 text-blue-600"
            >
              <Clock size={18} /> سجل حضوري
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shadow-sm">
              <img src={`https://picsum.photos/seed/${currentUser?.id}/40/40`} alt="Avatar" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{currentUser?.fullName}</p>
              <p className="text-xs text-slate-500">{currentUser?.role === 'admin' ? 'مدير' : 'موظف'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-10 max-w-7xl mx-auto">
          {view === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">بوابة الحضور</h2>
                  <p className="text-slate-500 mt-1">اليوم هو {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Clock size={80} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> الحالة الحالية
                  </h3>
                  
                  {!todayRecord ? (
                    <div className="space-y-4">
                      <p className="text-slate-600">لم تقم بتسجيل الدخول بعد لهذا اليوم.</p>
                      <button 
                        onClick={checkIn}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                      >
                        <LogIn size={20} /> تسجيل حضور الآن
                      </button>
                    </div>
                  ) : todayRecord.checkOut ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 flex items-center gap-3">
                        <Clock size={20} />
                        <span className="font-semibold">اكتملت الوردية</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl text-center">
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">دخول</p>
                          <p className="text-lg font-bold text-slate-800">{todayRecord.checkIn}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl text-center">
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">خروج</p>
                          <p className="text-lg font-bold text-slate-800">{todayRecord.checkOut}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 flex items-center gap-3 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                        <span className="font-semibold">الوردية جارية حالياً</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl mb-4 text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">وقت الدخول</p>
                        <p className="text-lg font-bold text-slate-800">{todayRecord.checkIn}</p>
                      </div>
                      <button 
                        onClick={checkOut}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                      >
                        <LogOut size={20} /> تسجيل انصراف الآن
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">السجل الأخير</h3>
                  <div className="space-y-4 flex-1">
                    {attendance.filter(r => r.userId === currentUser?.id).slice(-4).reverse().map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            <Calendar size={16} className="text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{new Date(r.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</p>
                            <p className="text-xs text-slate-500 text-left" dir="ltr">{r.checkIn} - {r.checkOut || '--:--'}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${r.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {r.status === 'present' ? 'حاضر' : 'متأخر'}
                        </span>
                      </div>
                    ))}
                    {attendance.filter(r => r.userId === currentUser?.id).length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <FileText size={40} className="mb-2 opacity-20" />
                        <p className="text-sm">لا توجد سجلات بعد</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="text-blue-600 w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">درجة الانضباط</h3>
                  <p className="text-4xl font-extrabold text-blue-600">92%</p>
                  <p className="text-sm text-slate-500 mt-2">أداء رائع! واصل الانضباط.</p>
                </div>
              </div>
            </div>
          )}

          {view === 'admin' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">مركز تحكم الإدارة</h2>
                  <p className="text-slate-500 mt-1">إدارة الموظفين ومراجعة أداء المؤسسة.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={generateReport}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                  >
                    {isGeneratingAi ? <Sparkles size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    تحليل الذكاء الاصطناعي
                  </button>
                  <button 
                    onClick={() => setIsUserModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                  >
                    <UserPlus size={18} />
                    إضافة عضو
                  </button>
                </div>
              </header>

              {aiReport && (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 p-8 opacity-20 rotate-12">
                    <Sparkles size={120} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles size={20} />
                      <h3 className="text-xl font-bold">تحليل الحضور الذكي</h3>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <p className="whitespace-pre-line text-blue-50 leading-relaxed font-medium">
                        {aiReport}
                      </p>
                    </div>
                    <button 
                      onClick={() => setAiReport(null)}
                      className="mt-6 text-sm text-blue-200 hover:text-white transition-colors flex items-center gap-1"
                    >
                      إخفاء التحليلات <ChevronLeft size={14} className="mr-1" />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">دليل الموظفين</h3>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{users.length} إجمالي الموظفين</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الموظف</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">القسم</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الدور</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                                  <img src={`https://picsum.photos/seed/${u.id}/40/40`} alt="Avatar" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{u.fullName}</p>
                                  <p className="text-xs text-slate-500" dir="ltr">@{u.username}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600">{u.department}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                {u.role === 'admin' ? 'مدير' : 'موظف'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-left">
                              <div className="flex items-center justify-start gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                  <Edit size={16} />
                                </button>
                                {u.id !== currentUser?.id && (
                                  <button 
                                    onClick={() => deleteUser(u.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
                  <h3 className="font-bold text-slate-800 mb-6">توقعات الحضور</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'الاثنين', count: 12 },
                        { name: 'الثلاثاء', count: 15 },
                        { name: 'الأربعاء', count: 14 },
                        { name: 'الخميس', count: 16 },
                        { name: 'الجمعة', count: 10 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                        <Tooltip 
                          cursor={{fill: '#f8fafc'}}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', textAlign: 'right' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 text-right">إحصائيات سريعة</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-2xl font-bold text-slate-800">{attendance.length}</p>
                        <p className="text-xs text-slate-500">عمليات دخول أسبوعية</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-2xl font-bold text-slate-800">89%</p>
                        <p className="text-xs text-slate-500">متوسط الانضباط</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Log Table */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-8">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">سجلات الحضور العامة</h3>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">تصدير CSV</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الموظف</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">التاريخ</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">وقت الدخول</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">وقت الخروج</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendance.slice().reverse().map(r => {
                        const user = users.find(u => u.id === r.userId);
                        return (
                          <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                                  <img src={`https://picsum.photos/seed/${r.userId}/40/40`} alt="Avatar" />
                                </div>
                                <span className="text-sm font-medium text-slate-900">{user?.fullName || 'موظف غير معروف'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{r.date}</td>
                            <td className="px-6 py-4 text-sm text-slate-600" dir="ltr">{r.checkIn}</td>
                            <td className="px-6 py-4 text-sm text-slate-600" dir="ltr">{r.checkOut || '--:--'}</td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${r.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {r.status === 'present' ? 'حاضر' : 'متأخر'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {attendance.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                            لا توجد سجلات حضور في النظام.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl text-white">
                  <UserPlus size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">إضافة موظف جديد</h3>
              </div>
              <button 
                onClick={() => setIsUserModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">الاسم الكامل</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-right"
                    placeholder="مثال: أحمد محمد"
                    value={newUserForm.fullName}
                    onChange={e => setNewUserForm({...newUserForm, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">اسم المستخدم</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-right"
                    placeholder="مثال: amohamed"
                    value={newUserForm.username}
                    onChange={e => setNewUserForm({...newUserForm, username: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">كلمة المرور</label>
                <input 
                  type="password" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-right"
                  placeholder="••••••••"
                  value={newUserForm.password}
                  onChange={e => setNewUserForm({...newUserForm, password: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">القسم</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none bg-white text-right"
                    value={newUserForm.department}
                    onChange={e => setNewUserForm({...newUserForm, department: e.target.value})}
                  >
                    <option value="الهندسة">الهندسة</option>
                    <option value="التصميم">التصميم</option>
                    <option value="الموارد البشرية">الموارد البشرية</option>
                    <option value="التسويق">التسويق</option>
                    <option value="العمليات">العمليات</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">الدور الوظيفي</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none bg-white text-right"
                    value={newUserForm.role}
                    onChange={e => setNewUserForm({...newUserForm, role: e.target.value as UserRole})}
                  >
                    <option value="employee">موظف</option>
                    <option value="admin">مدير نظام</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-200 transition-all"
                >
                  حفظ الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
