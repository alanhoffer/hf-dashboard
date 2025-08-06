import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import { getOrders, getProductions } from '../services/beeService';
import { Search, Calendar, User, Package, Factory, FileText, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';

const History = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  });

  const { data: productions, isLoading: productionsLoading } = useQuery({
    queryKey: ['productions'],
    queryFn: getProductions,
  });

  const filteredOrders = orders?.filter(order =>
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    format(order.deliveryDate, 'yyyy-MM-dd').includes(searchTerm) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredProductions = productions?.filter(production =>
    format(production.transferDate, 'yyyy-MM-dd').includes(searchTerm) ||
    production.hivesUsed.some(hive => hive.toLowerCase().includes(searchTerm.toLowerCase())) ||
    production.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'in_production': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'insufficient': return 'bg-red-100 text-red-800 border-red-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 z-10 gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">{t('history.title')}</h1>
            <p className="text-sm text-slate-600 hidden sm:block">{t('history.subtitle')}</p>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Search */}
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('history.searchPlaceholder')}
                  className="pl-10 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Order History */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <ShoppingCart className="h-5 w-5" />
                {t('history.orderHistory')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-8">{t('common.loading')}</div>
              ) : filteredOrders.length > 0 ? (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="font-medium text-slate-800">{order.customerName}</h3>
                          <Badge className={getStatusColor(order.status)}>
                            {t(`status.${order.status}`)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {order.numberOfCells} {t('orders.cells')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(order.deliveryDate, 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-slate-500">
                            {t('history.orderPlaced')} {format(order.createdAt, 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">{t('history.noOrderHistory')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Production History */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Factory className="h-5 w-5" />
                {t('history.productionHistory')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productionsLoading ? (
                <div className="text-center py-8">{t('common.loading')}</div>
              ) : filteredProductions.length > 0 ? (
                <div className="space-y-4">
                  {filteredProductions.map((production) => (
                    <div key={production.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                        <h3 className="font-medium text-slate-800">
                          Production - {format(production.transferDate, 'MMM dd, yyyy')}
                        </h3>
                        <div className="text-xs text-slate-500">
                          {t('history.recorded')} {format(production.createdAt, 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {production.larvaeTransferred} larvae
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {production.cellsProduced} cells
                        </div>
                        {production.hivesUsed.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Factory className="h-3 w-3" />
                            {production.hivesUsed.join(', ')}
                          </div>
                        )}
                        {production.acceptedCells && (
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {Math.round((production.acceptedCells / production.larvaeTransferred) * 100)}% acceptance
                          </div>
                        )}
                      </div>
                      {production.notes && (
                        <div className="mt-2 flex items-start gap-1 text-sm text-slate-600">
                          <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <p>{production.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">{t('history.noProductionHistory')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default History;