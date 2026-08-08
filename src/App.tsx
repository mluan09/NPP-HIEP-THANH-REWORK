import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getDb, deleteUserSession, checkSessionExists } from './lib/db';
import type { Profile, InventoryItem, Customer, Sale, SaleItem, Debt, CashbookEntry } from './lib/db';
import { supabase, supabaseConfigError } from './lib/supabase';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastProvider, useToast } from './components/Toast';
import { RotateLockOverlay } from './components/RotateLockOverlay';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const InventoryPage = lazy(() => import('./pages/InventoryPage').then((module) => ({ default: module.InventoryPage })));
const CustomersPage = lazy(() => import('./pages/CustomersPage').then((module) => ({ default: module.CustomersPage })));
const SalesPage = lazy(() => import('./pages/SalesPage').then((module) => ({ default: module.SalesPage })));
const DebtsPage = lazy(() => import('./pages/DebtsPage').then((module) => ({ default: module.DebtsPage })));
const CashbookPage = lazy(() => import('./pages/CashbookPage').then((module) => ({ default: module.CashbookPage })));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage').then((module) => ({ default: module.FeedbackPage })));
const AccountsPage = lazy(() => import('./pages/AccountsPage').then((module) => ({ default: module.AccountsPage })));
const ActivityLogPage = lazy(() => import('./pages/ActivityLogPage').then((module) => ({ default: module.ActivityLogPage })));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-500dark:text-slate-400">
        <div className="w-9 h-9 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
        <span className="text-sm font-medium">Đang tải trang...</span>
      </div>
    </div>
  );
}

function AppInner() {
  const navigate = useNavigate();
  const location = useLocation();

  if (supabaseConfigError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md bg-red-950/20 border border-red-900/50 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-lg font-bold text-red-400 mb-2">Lỗi Cấu Hình</h1>
          <p className="text-sm text-red-300/80mb-4">{supabaseConfigError}</p>
          <p className="text-xs text-slate-400">Liên hệ quản trị viên để khắc phục.</p>
        </div>
      </div>
    );
  }

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [cashbook, setCashbook] = useState<CashbookEntry[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const sessionTokenRef = useRef<string | null>(localStorage.getItem('npp_session_token'));
  const { showToast } = useToast();

  const activeTab = location.pathname.replace('/', '') || 'sales';

  // Restore Supabase session on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profileData) {
          const profile = profileData as Profile;
          if (profile.is_locked) {
            await supabase.auth.signOut();
          } else {
            setCurrentUser(profile);
          }
        }
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setCurrentUser(null);
      } else if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profileData) {
          const profile = profileData as Profile;
          if (profile.is_locked) {
            await supabase.auth.signOut();
          } else {
            setCurrentUser(profile);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load all DB data from Supabase once auth is resolved
  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setDbLoading(false);
      return;
    }
    // Only show full-screen loader on first load
    if (!hasLoadedOnce.current) {
      setDbLoading(true);
    }
    getDb()
      .then((db) => {
        setProfiles(db.profiles);
        setInventory(db.inventory);
        setCustomers(db.customers);
        setSales(db.sales);
        setSaleItems(db.sale_items);
        setDebts(db.debts);
        setCashbook(db.cashbook);
        hasLoadedOnce.current = true;
      })
      .catch(console.error)
      .finally(() => setDbLoading(false));
  }, [currentUser, authLoading]);

  // Refresh data silently when tab becomes visible again, also re-validate session
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible' && currentUser && hasLoadedOnce.current) {
        // Session validity check: if session was revoked on another device while this tab was hidden
        const token = sessionTokenRef.current;
        if (token) {
          try {
            const exists = await checkSessionExists(token);
            if (!exists) {
              sessionTokenRef.current = null;
              localStorage.removeItem('npp_session_token');
              await supabase.auth.signOut();
              setCurrentUser(null);
              showToast('⚠️ Phiên đăng nhập đã bị thu hồi do đăng nhập ở thiết bị khác. Vui lòng đăng nhập lại.', 'warning');
              navigate('/login');
              return;
            }
          } catch { /* ignore network errors */ }
        }
        getDb()
          .then((db) => {
            setProfiles(db.profiles);
            setInventory(db.inventory);
            setCustomers(db.customers);
            setSales(db.sales);
            setSaleItems(db.sale_items);
            setDebts(db.debts);
            setCashbook(db.cashbook);
          })
          .catch(console.error);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [currentUser, navigate, showToast]);

  // Force Dark Mode always on
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleTabChange = (tab: string) => {
    navigate(`/${tab}`);
  };

  const handleLoginSuccess = (profile: Profile, sessionToken: string) => {
    sessionTokenRef.current = sessionToken;
    localStorage.setItem('npp_session_token', sessionToken);
    setCurrentUser(profile);
    navigate('/sales');
  };

  const handleLogout = useCallback(async (reason?: string) => {
    const token = sessionTokenRef.current;
    sessionTokenRef.current = null;
    localStorage.removeItem('npp_session_token');
    if (token) {
      try { await deleteUserSession(token); } catch { /* ignore */ }
    }
    await supabase.auth.signOut();
    setCurrentUser(null);
    if (reason) showToast(reason);
    navigate('/login');
  }, [navigate, showToast]);

  //── Realtime: force-logout khi đăng nhập đồng thời ──
  // Dùng cả Broadcast (nhanh, không cần realtime table) và postgres_changes (fallback)
  useEffect(() => {
    if (!currentUser) return;

    const handleForcedLogout = () => {
      if (!sessionTokenRef.current) return; // đã logout rồi
      sessionTokenRef.current = null;
      localStorage.removeItem('npp_session_token');
      supabase.auth.signOut().then(() => {
        setCurrentUser(null);
        showToast('⚠️ Tài khoản vừa đăng nhập ở thiết bị khác. Phiên này đã bị đăng xuất ngay lập tức.', 'warning');
        navigate('/login');
      });
    };

    const handleLockedLogout = () => {
      if (!sessionTokenRef.current) return;
      sessionTokenRef.current = null;
      localStorage.removeItem('npp_session_token');
      supabase.auth.signOut().then(() => {
        setCurrentUser(null);
        showToast('⚠️ Tài khoản đã bị khoá bởi quản trị viên. Bạn đã bị đăng xuất.', 'warning');
        navigate('/login');
      });
    };

    const channel = supabase
      .channel(`session-monitor-${currentUser.id}`)
      .on('broadcast', { event: 'account_locked' }, handleLockedLogout)
      // Broadcast: cơ chế chính — phát hiện ngay khi thiết bị kia gửi tín hiệu
      .on('broadcast', { event: 'force_logout' }, handleForcedLogout)
      // postgres_changes: fallback — khi thiết bị kia xoá session trong DB
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'user_sessions', filter: `user_id=eq.${currentUser.id}` },
        handleForcedLogout
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, navigate, showToast]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-9 h-9 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
      </div>
    );
  }

  if (location.pathname === '/login') {
    if (currentUser) return <Navigate to="/sales" replace />;
    return (
      <Suspense fallback={<PageLoader />}>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </Suspense>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'staff' && location.pathname === '/cashbook') {
    return <Navigate to="/sales" replace />;
  }
  if (currentUser.role !== 'owner' && (location.pathname === '/accounts' || location.pathname === '/activity-log')) {
    return <Navigate to="/sales" replace />;
  }

  if (dbLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-9 h-9 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
          <span className="text-sm font-medium">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex transition-colors duration-300">
      <Sidebar
        setActiveTab={handleTabChange}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="flex-1 pl-68 min-h-screen flex flex-col">
        <Header
          activeTab={activeTab}
          currentUser={currentUser}
        />

        <main className="p-8 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="h-full"
            >
              <Suspense fallback={<PageLoader />}>
                <Routes location={location}>
                  <Route path="/" element={<Navigate to="/sales" replace />} />

                  <Route
                    path="/sales"
                    element={
                      <SalesPage
                        customers={customers}
                        inventory={inventory}
                        setInventory={setInventory}
                        sales={sales}
                        setSales={setSales}
                        saleItems={saleItems}
                        setSaleItems={setSaleItems}
                        debts={debts}
                        setDebts={setDebts}
                        cashbook={cashbook}
                        setCashbook={setCashbook}
                        currentUser={currentUser}
                      />
                    }
                  />

                  <Route
                    path="/inventory"
                    element={
                      <InventoryPage
                        inventory={inventory}
                        setInventory={setInventory}
                        currentUser={currentUser}
                      />
                    }
                  />

                  <Route
                    path="/customers"
                    element={
                      <CustomersPage
                        customers={customers}
                        setCustomers={setCustomers}
                        sales={sales}
                        setSales={setSales}
                        saleItems={saleItems}
                        setSaleItems={setSaleItems}
                        inventory={inventory}
                        setInventory={setInventory}
                        debts={debts}
                        setDebts={setDebts}
                        cashbook={cashbook}
                        setCashbook={setCashbook}
                        currentUser={currentUser}
                      />
                    }
                  />

                  <Route
                    path="/debts"
                    element={
                      <DebtsPage
                        debts={debts}
                        setDebts={setDebts}
                        customers={customers}
                        cashbook={cashbook}
                        setCashbook={setCashbook}
                        sales={sales}
                        saleItems={saleItems}
                        inventory={inventory}
                        currentUser={currentUser}
                      />
                    }
                  />

                  <Route
                    path="/cashbook"
                    element={
                      <CashbookPage
                        cashbook={cashbook}
                        setCashbook={setCashbook}
                        sales={sales}
                        saleItems={saleItems}
                        customers={customers}
                        inventory={inventory}
                        profiles={profiles}
                        currentUser={currentUser}
                      />
                    }
                  />

                  <Route
                    path="/accounts"
                    element={
                      <AccountsPage
                        currentUser={currentUser}
                        profiles={profiles}
                        onProfilesChange={setProfiles}
                      />
                    }
                  />
                  <Route
                    path="/activity-log"
                    element={
                      <ActivityLogPage
                        currentUser={currentUser}
                      />
                    }
                  />
                  <Route path="/feedback" element={<FeedbackPage />} />
                  <Route path="*" element={<Navigate to="/sales" replace />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <RotateLockOverlay />
        <AppInner />
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;