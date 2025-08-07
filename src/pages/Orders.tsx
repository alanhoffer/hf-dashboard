import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { getOrders, addOrder, updateOrderStatus, CustomerOrder } from '../services/beeService';
import { Plus, Calendar, User, Package, ArrowRight, X, Factory, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const Orders = () => {
  const { t } = useLanguage();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    numberOfCells: '',
    deliveryDate: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  });


  const addOrderMutation = useMutation({
    mutationFn: addOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: t('orders.orderAdded'),
        description: t('orders.orderAddedDesc'),
      });
      setFormData({ customerName: '', numberOfCells: '', deliveryDate: '' });
      setShowAddForm(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: CustomerOrder['status'] }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: t('orders.orderStatusUpdated'),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.numberOfCells || !formData.deliveryDate) {
      toast({
        title: t('orders.fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    addOrderMutation.mutate({
      customerName: formData.customerName,
      numberOfCells: parseInt(formData.numberOfCells),
      deliveryDate: new Date(formData.deliveryDate),
      larvaeTransferDate: new Date(formData.deliveryDate), // You may want to adjust this logic
    });
  };

  const getStatusColor = (status: CustomerOrder['status']) => {
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

  const getNextStatus = (currentStatus: CustomerOrder['status']) => {
    switch (currentStatus) {
      case 'in_production': return 'ready';
      case 'ready': return 'delivered';
      case 'partial': return 'ready';
      case 'insufficient': return 'in_production';
      default: return currentStatus;
    }
  };

  const getNextStatusLabel = (currentStatus: CustomerOrder['status']) => {
    switch (currentStatus) {
      case 'in_production': return t('orders.markReady');
      case 'ready': return t('orders.markDelivered');
      case 'partial': return t('orders.markReady');
      case 'insufficient': return t('orders.startProduction');
      default: return '';
    }
  };

  const canAdvanceStatus = (status: CustomerOrder['status']) => {
    return ['in_production', 'ready', 'partial', 'insufficient'].includes(status);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 z-10 gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">{t('orders.title')}</h1>
            <p className="text-sm text-slate-600 hidden sm:block">{t('orders.subtitle')}</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('orders.newOrder')}
        </Button>
      </header>

      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Add Order Form */}
          {showAddForm && (
            <Card className="border-slate-200 shadow-lg">
              <CardHeader className="bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-800">{t('orders.addNewOrder')}</CardTitle>
                    <CardDescription className="hidden sm:block">
                      {t('orders.addNewOrderDesc')}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="customerName" className="text-slate-700">{t('orders.customerName')}</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        placeholder={t('orders.customerNamePlaceholder')}
                        className="border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="numberOfCells" className="text-slate-700">{t('orders.numberOfCells')}</Label>
                        <Input
                          id="numberOfCells"
                          type="number"
                          min="1"
                          value={formData.numberOfCells}
                          onChange={(e) => setFormData({ ...formData, numberOfCells: e.target.value })}
                          placeholder={t('orders.numberOfCellsPlaceholder')}
                          className="border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deliveryDate" className="text-slate-700">{t('orders.deliveryDate')}</Label>
                        <Input
                          id="deliveryDate"
                          type="date"
                          value={formData.deliveryDate}
                          onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                          className="border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="submit"
                      disabled={addOrderMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                    >
                      {addOrderMutation.isPending ? t('orders.adding') : t('orders.addOrder')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
                    >
                      {t('orders.cancel')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Orders List */}
          <div className="space-y-4">
            {isLoading ? (

              <div className="flex flex-col h-full w-full">
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

            ) : orders && orders.length > 0 ? (
              orders.map((order) => (
                <Card key={order.id} className="border-slate-200 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                              <h3 className="text-lg font-semibold text-slate-800">{order.customerName}</h3>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {t(`status.${order.status}`)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm ml-0 sm:ml-13">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-slate-500" />
                              <span className="text-slate-600">{order.numberOfCells} {t('orders.cells')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-500" />
                              <span className="text-slate-600">
                                {t('orders.transfer')} {format(order.larvaeTransferDate, 'MMM dd, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-500" />
                              <span className="text-slate-600">
                                {t('orders.delivery')} {format(order.deliveryDate, 'MMM dd, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 ml-0 sm:ml-13">
                        {order.status === 'pending' && (
                          <Link to={`/production?orderId=${order.id}`}>
                            <Button className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
                              <Factory className="h-4 w-4 mr-2" />
                              {t('orders.startProduction')}
                            </Button>
                          </Link>
                        )}

                        {canAdvanceStatus(order.status) && order.status !== 'pending' && (
                          <Button
                            onClick={() => updateStatusMutation.mutate({
                              orderId: order.id,
                              status: getNextStatus(order.status)
                            })}
                            disabled={updateStatusMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            {getNextStatusLabel(order.status)}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-slate-200">
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 text-lg mb-2">{t('orders.noOrders')}</p>
                  <p className="text-slate-400 text-sm mb-4">{t('orders.noOrdersDesc')}</p>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('orders.addFirstOrder')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Orders;