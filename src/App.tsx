import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getDb, saveDb } from './lib/db';
import type { Profile, InventoryItem, Customer, Sale, SaleItem, Debt, CashbookEntry } from './lib/db';
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

// ─── Inner App (needs router context) ───────────────────────────────────────
function AppInner() {
  const navigate = useNavigate();
  const location = useLocation();

  // Load database state
  const db = getDb();

  const [profiles] = useState<Profile[]>(db.profiles);
  const [inventory, setInventory] = useState<InventoryItem[]>(db.inventory);
  const [customers, setCustomers] = useState<Customer[]>(db.customers);
  const [sales, setSales] = useState<Sale[]>(db.sales);
  const [saleItems, setSaleItems] = useState<SaleItem[]>(db.sale_items);
  const [debts, setDebts] = useState<Debt[]>(db.debts);
  const [cashbook, setCashbook] = useState<CashbookEntry[]>(db.cashbook);

  // App UI State
  const [currentUser, setCurrentUser] = useState<Profile | null>(() => {
    const saved = localStorage.getItem('hiepthanh_npp_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Derive activeTab from current URL path
  const activeTab = location.pathname.replace('/', '') || 'sales';

  // Sync to database
  useEffect(() => {
    saveDb({
      profiles,
      inventory,
      customers,
      sales,
      sale_items: saleItems,
      debts,
      cashbook,
    });
  }, [inventory, customers, sales, saleItems, debts, cashbook, profiles]);

  // Sync user session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('hiepthanh_npp_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('hiepthanh_npp_current_user');
    }
  }, [currentUser]);

  // Force Dark Mode always on
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Navigate via sidebar
  const handleTabChange = (tab: string) => {
    navigate(`/${tab}`);
  };

  // Handles quick role switches
  const handleRoleSwitch = (profile: Profile) => {
    setCurrentUser(profile);

    // Auto-redirect if switching to a role that cannot see cashbook
    if (profile.role === 'staff' && location.pathname === '/cashbook') {
      navigate('/sales');
    }
  };

  const handleLoginSuccess = (profile: Profile) => {
    setCurrentUser(profile);
    navigate('/sales');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
  };

  // If user is at /login route
  if (location.pathname === '/login') {
    if (currentUser) {
      return <Navigate to="/sales" replace />;
    }
    return <LoginPage profiles={profiles} onLoginSuccess={handleLoginSuccess} />;
  }

  // ── Guard: redirect to /login if not authenticated ──
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // ── Guard: staff cannot access /cashbook ──
  if (currentUser.role === 'staff' && location.pathname === '/cashbook') {
    return <Navigate to="/sales" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Navigation Sidebar */}
      <Sidebar
        setActiveTab={handleTabChange}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Workspace */}
      <div className="flex-1 pl-68 min-h-screen flex flex-col">
        <Header
          activeTab={activeTab}
          currentUser={currentUser}
          profiles={profiles}
          onRoleSwitch={handleRoleSwitch}
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
                {/* Default redirect */}
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

                <Route path="/feedback" element={<FeedbackPage />} />

                {/* Fallback: redirect unknown paths to sales */}
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

// ─── Root App with Router provider ──────────────────────────────────────────
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
