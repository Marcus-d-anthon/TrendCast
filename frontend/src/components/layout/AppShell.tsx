import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import styles from './AppShell.module.css';

const COLAPSADO_KEY = 'trendcast.sidebar.colapsado';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [colapsado, setColapsado] = useState(() => localStorage.getItem(COLAPSADO_KEY) === '1');
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  function toggleColapsado() {
    setColapsado((prev) => {
      const siguiente = !prev;
      localStorage.setItem(COLAPSADO_KEY, siguiente ? '1' : '0');
      return siguiente;
    });
  }

  return (
    <div className={styles.shell}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} colapsado={colapsado} onToggleColapsado={toggleColapsado} />
      <div className={styles.main}>
        <Topbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
