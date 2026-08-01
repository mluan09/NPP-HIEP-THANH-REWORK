import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getDb } from './lib/db';
import type { Profile, InventoryItem, Customer, Sale, SaleItem, Debt, CashbookEntry } from './lib/db';
import { supabase, supabaseConfigError } from './lib/supabase';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastProvider } from './components/Toast';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const InventoryPage = lazy(() => import('./pages/InventoryPage').then((module) => ({ default: module.InventoryPage })));
const CustomersPage = lazy(() => import('./pages/CustomersPage').then((module) => ({ default: module.CustomersPage })));
const SalesPage = lazy(() => import('./pages/SalesPage').then((module) => ({ default: module.SalesPage })));
const DebtsPage = lazy(() => import('./pages/DebtsPage').then((module) => ({ default: module.DebtsPage })));
const CashbookPage = lazy(() => import('./pages/CashbookPage').then((module) => ({ default: module.CashbookPage })));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage').then((module) => ({ default: module.FeedbackPage })));
const AccountsPage = lazy(() => import('./pages/AccountsPage').then((module) => ({ default: module.AccountsPage })));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
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
          <p className="text-sm text-red-300/80 mb-4">{supabaseConfigError}</p>
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

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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
        if (profileData) setCurrentUser(profileData as Profile);
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
        if (profileData) setCurrentUser(profileData as Profile);
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
    setDbLoading(true);
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
      .catch(console.error)
      .finally(() => setDbLoading(false));
  }, [currentUser, authLoading]);

  // Force Dark Mode always on
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleTabChange = (tab: string) => {
    navigate(`/${tab}`);
  };

  const handleLoginSuccess = (profile: Profile) => {
    setCurrentUser(profile);
    navigate('/sales');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    navigate('/login');
  };

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
  if (currentUser.role !== 'owner' && location.pathname === '/accounts') {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
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
                        debts={debts}
                        setDebts={setDebts}
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
        <AppInner />
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;