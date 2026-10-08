import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/common/Header.tsx';
import { Sidebar } from '../components/common/Sidebar.tsx';
import { GeminiChatbotDrawer } from '../components/common/GeminiChatbotDrawer.tsx';
import { api } from '../services/api.ts';
import { NotificationItem } from '../types.ts';

export const DashboardLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pendingEmergencies, setPendingEmergencies] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const loadNotificationsAndMetrics = async () => {
    try {
      const [notifRes, emergRes, invRes] = await Promise.all([
        api.getNotifications().catch(() => ({ notifications: [] })),
        api.getEmergencyQueue().catch(() => ({ count: 0 })),
        api.getInventory().catch(() => ({ inventory: [] }))
      ]);
      setNotifications(notifRes.notifications);
      setPendingEmergencies(emergRes.count);
      setLowStockCount(invRes.inventory.filter(i => i.quantity <= i.minimum_stock).length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotificationsAndMetrics();
    const interval = setInterval(loadNotificationsAndMetrics, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased">
      {/* Top Header */}
      <Header
        notifications={notifications}
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onRefreshNotifications={loadNotificationsAndMetrics}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar
            pendingEmergencyCount={pendingEmergencies}
            lowStockCount={lowStockCount}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative z-50 flex-1 max-w-xs w-full bg-slate-900 flex">
              <Sidebar
                onCloseMobile={() => setMobileSidebarOpen(false)}
                pendingEmergencyCount={pendingEmergencies}
                lowStockCount={lowStockCount}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Floating Gemini Clinical Assistant */}
      <GeminiChatbotDrawer />
    </div>
  );
};
