import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDashboardStats } from '../services/beeService';
import { useLanguage } from '../contexts/LanguageContext';
import { ShoppingCart, Factory, Package, TrendingUp, Calendar, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const Dashboard = () => {
  const { t } = useLanguage();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full">
        <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-4">
          <SidebarTrigger />
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">{t('dashboard.title')}</h1>
        </header>
        <main className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-center gap-6">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-lg font-medium text-slate-700">{t('common.loading')}</p>

          {/* Skeleton cards */}
          <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse border border-slate-200 rounded-lg p-4 bg-slate-100 h-24"
              >
                <div className="h-6 w-3/4 bg-slate-300 rounded mb-3" />
                <div className="h-8 w-1/3 bg-slate-300 rounded" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">{t('dashboard.title')}</h1>
          <p className="text-sm text-slate-600 hidden sm:block">{t('dashboard.subtitle')}</p>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold">{t('dashboard.systemTitle')}</h2>
            </div>
            <p className="text-blue-100">{t('dashboard.systemSubtitle')}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="border-slate-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{t('dashboard.pendingOrders')}</CardTitle>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{stats?.pendingOrders || 0}</div>
                <p className="text-xs text-slate-500">{t('dashboard.pendingOrdersDesc')}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{t('dashboard.inProduction')}</CardTitle>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Factory className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{stats?.inProduction || 0}</div>
                <p className="text-xs text-slate-500">{t('dashboard.inProductionDesc')}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{t('dashboard.availableStock')}</CardTitle>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{stats?.availableStock || 0}</div>
                <p className="text-xs text-slate-500">{t('dashboard.availableStockDesc')}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{t('dashboard.totalProduced')}</CardTitle>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{stats?.totalProduced || 0}</div>
                <p className="text-xs text-slate-500">{t('dashboard.totalProducedDesc')}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{t('dashboard.acceptanceRate')}</CardTitle>
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">
                  {stats?.averageAcceptanceRate ? `${stats.averageAcceptanceRate}%` : t('common.na')}
                </div>
                <p className="text-xs text-slate-500">{t('dashboard.acceptanceRateDesc')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Alerts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Transfers */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  {t('dashboard.upcomingTransfers')}
                </CardTitle>
                <CardDescription>
                  {t('dashboard.upcomingTransfersDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.upcomingTransfers && stats.upcomingTransfers.length > 0 ? (
                  <div className="space-y-3">
                    {stats.upcomingTransfers.map((order) => (
                      <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                        <div>
                          <p className="font-medium text-slate-800">{order.customerName}</p>
                          <p className="text-sm text-slate-600">{order.numberOfCells} {t('orders.cells')}</p>
                        </div>
                        <div className="text-right mt-2 sm:mt-0">
                          <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(order.larvaeTransferDate, 'MMM dd')}
                          </Badge>
                          <p className="text-xs text-slate-500 mt-1">
                            {t('dashboard.delivery')} {format(order.deliveryDate, 'MMM dd')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">{t('dashboard.noUpcomingTransfers')}</p>
                    <p className="text-sm text-slate-400">{t('dashboard.allCaughtUp')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expiring Stock */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  Expiring Stock
                </CardTitle>
                <CardDescription>
                  Stock packages expiring in the next 3 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.expiringStock && stats.expiringStock.length > 0 ? (
                  <div className="space-y-3">
                    {stats.expiringStock.map((pkg) => {
                      const daysLeft = differenceInDays(pkg.expirationDate, new Date());
                      return (
                        <div key={pkg.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
                          <div>
                            <p className="font-medium text-slate-800">{pkg.availableCells} cells available</p>
                            <p className="text-sm text-slate-600">From: {pkg.originHives.join(', ')}</p>
                          </div>
                          <div className="text-right mt-2 sm:mt-0">
                            <Badge variant="outline" className={
                              daysLeft <= 1
                                ? "border-red-200 text-red-700 bg-red-50"
                                : "border-orange-200 text-orange-700 bg-orange-50"
                            }>
                              <Clock className="w-3 h-3 mr-1" />
                              {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}
                            </Badge>
                            <p className="text-xs text-slate-500 mt-1">
                              Expires: {format(pkg.expirationDate, 'MMM dd')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No stock expiring soon</p>
                    <p className="text-sm text-slate-400">All stock is fresh!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;