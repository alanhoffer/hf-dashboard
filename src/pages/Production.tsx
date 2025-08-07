import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { getProductions, addProduction, getOrders, updateAcceptedCells, getOrderById } from '../services/beeService';
import { Plus, Calendar, Factory, Package, FileText, X, CheckCircle, TrendingUp, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const Production = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const prefilledOrderId = searchParams.get('orderId');

  const [showAddForm, setShowAddForm] = useState(!!prefilledOrderId);
  const [showAcceptanceDialog, setShowAcceptanceDialog] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState<string | null>(null);
  const [acceptedCellsCount, setAcceptedCellsCount] = useState('');
  const [formData, setFormData] = useState({
    transferDate: '',
    larvaeTransferred: '',
    hives: '',
    cellsProduced: '',
    orderId: prefilledOrderId || '',
    notes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: productions, isLoading } = useQuery({
    queryKey: ['productions'],
    queryFn: getProductions,
  });

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  });

  console.log(productions)

  const { data: prefilledOrder } = useQuery({
    queryKey: ['order', prefilledOrderId],
    queryFn: () => prefilledOrderId ? getOrderById(prefilledOrderId) : null,
    enabled: !!prefilledOrderId,
  });

  // Pre-fill form when order data is loaded
  useEffect(() => {
    if (prefilledOrder && prefilledOrderId) {
      setFormData(prev => ({
        ...prev,
        transferDate: format(prefilledOrder.larvaeTransferDate, 'yyyy-MM-dd'),
        orderId: prefilledOrderId,
        notes: `Production for ${prefilledOrder.customerName} - ${prefilledOrder.numberOfCells} cells needed for delivery on ${format(prefilledOrder.deliveryDate, 'MMM dd, yyyy')}`
      }));
    }
  }, [prefilledOrder, prefilledOrderId]);

  const addProductionMutation = useMutation({
    mutationFn: addProduction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: t('production.productionAdded'),
        description: t('production.productionAddedDesc'),
      });
      setFormData({ transferDate: '', larvaeTransferred: '', hives: '', cellsProduced: '', orderId: '', notes: '' });
      setShowAddForm(false);
    },
  });

  const updateAcceptanceMutation = useMutation({
    mutationFn: ({ productionId, acceptedCells }: { productionId: string; acceptedCells: number }) =>
      updateAcceptedCells(productionId, acceptedCells),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast({
        title: t('production.acceptedCellsRecorded'),
        description: t('production.acceptedCellsRecordedDesc'),
      });
      setShowAcceptanceDialog(false);
      setSelectedProduction(null);
      setAcceptedCellsCount('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.transferDate || !formData.larvaeTransferred || !formData.cellsProduced) {
      toast({
        title: t('production.fillRequired'),
        description: t('production.fillRequiredDesc'),
        variant: "destructive",
      });
      return;
    }

    const hivesArray = formData.hives
      .split(',')
      .map(hive => hive.trim())
      .filter(hive => hive.length > 0);

    addProductionMutation.mutate({
      transferDate: new Date(formData.transferDate),
      larvaeTransferred: parseInt(formData.larvaeTransferred),
      hives: hivesArray,
      cellsProduced: parseInt(formData.cellsProduced),
      orderId: formData.orderId || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleRecordAcceptance = (productionId: string) => {
    setSelectedProduction(productionId);
    setShowAcceptanceDialog(true);
  };

  const confirmAcceptance = () => {
    if (!selectedProduction || !acceptedCellsCount) {
      toast({
        title: t('production.enterAcceptedCells'),
        variant: "destructive",
      });
      return;
    }

    updateAcceptanceMutation.mutate({
      productionId: selectedProduction,
      acceptedCells: parseInt(acceptedCellsCount)
    });
  };

  const getRelatedOrder = (orderId?: string) => {
    if (!orderId || !orders) return null;
    return orders.find(order => order.id === orderId);
  };

  const calculateExtraCells = (production: any) => {
    const relatedOrder = getRelatedOrder(production.orderId);
    if (!relatedOrder) return production.cellsProduced;
    return Math.max(0, production.cellsProduced - relatedOrder.numberOfCells);
  };

  const calculateAcceptanceRate = (production: any) => {
    if (!production.acceptedCells || !production.larvaeTransferred) return null;
    return Math.round((production.acceptedCells / production.larvaeTransferred) * 100);
  };

  const getProductionStatusBadge = (production: any) => {
    switch (production.status) {
      case 'sold':
        return <Badge className="bg-green-100 text-green-800 border-green-200">
          <DollarSign className="w-3 h-3 mr-1" />
          All Sold
        </Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 border-red-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expired
        </Badge>;
      case 'active':
      default:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <Factory className="w-3 h-3 mr-1" />
          Active
        </Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 z-10 gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">{t('production.title')}</h1>
            <p className="text-sm text-slate-600 hidden sm:block">{t('production.subtitle')}</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('production.addProduction')}
        </Button>
      </header>

      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Pre-filled Order Alert */}
          {prefilledOrder && showAddForm && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Factory className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">
                      Starting production for {prefilledOrder.customerName}
                    </p>
                    <p className="text-sm text-blue-600">
                      {prefilledOrder.numberOfCells} cells needed • Delivery: {format(prefilledOrder.deliveryDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Production Form */}
          {showAddForm && (
            <Card className="border-slate-200 shadow-lg">
              <CardHeader className="bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-800">{t('production.addProductionRecord')}</CardTitle>
                    <CardDescription className="hidden sm:block">
                      {t('production.addProductionDesc')}
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="transferDate" className="text-slate-700">{t('production.transferDate')} *</Label>
                      <Input
                        id="transferDate"
                        type="date"
                        value={formData.transferDate}
                        onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                        className="border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="larvaeTransferred" className="text-slate-700">{t('production.larvaeTransferred')} *</Label>
                      <Input
                        id="larvaeTransferred"
                        type="number"
                        min="0"
                        value={formData.larvaeTransferred}
                        onChange={(e) => setFormData({ ...formData, larvaeTransferred: e.target.value })}
                        placeholder={t('production.larvaeTransferredPlaceholder')}
                        className="border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cellsProduced" className="text-slate-700">{t('production.finalCellsProduced')} *</Label>
                      <Input
                        id="cellsProduced"
                        type="number"
                        min="0"
                        value={formData.cellsProduced}
                        onChange={(e) => setFormData({ ...formData, cellsProduced: e.target.value })}
                        placeholder={t('production.finalCellsProducedPlaceholder')}
                        className="border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hives" className="text-slate-700">{t('production.hives')}</Label>
                      <Input
                        id="hives"
                        value={formData.hives}
                        onChange={(e) => setFormData({ ...formData, hives: e.target.value })}
                        placeholder={t('production.hivesPlaceholder')}
                        className="border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                      <p className="text-xs text-slate-500 mt-1 hidden sm:block">{t('production.hivesDesc')}</p>
                    </div>
                    <div>
                      <Label htmlFor="orderId" className="text-slate-700">{t('production.relatedOrder')}</Label>
                      <select
                        id="orderId"
                        value={formData.orderId}
                        onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-md focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      >
                        <option value="">{t('production.selectOrder')}</option>
                        {orders?.filter(order => order.status !== 'delivered').map(order => (
                          <option key={order.id} value={order.id}>
                            {order.customerName} - {order.numberOfCells} {t('orders.cells')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-slate-700">{t('production.notes')}</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={t('production.notesPlaceholder')}
                      className="border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                      rows={3}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="submit"
                      disabled={addProductionMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                    >
                      {addProductionMutation.isPending ? t('production.addingProduction') : t('production.addProduction')}
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

          {/* Production Records */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
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
              </div>
            ) : productions && productions.length > 0 ? (
              productions.map((production) => {
                const relatedOrder = getRelatedOrder(production.orderId);
                const extraCells = calculateExtraCells(production);
                const acceptanceRate = calculateAcceptanceRate(production);

                return (
                  <Card key={production.id} className="border-slate-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                  <Factory className="h-5 w-5 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800">
                                  Production - {format(production.transferDate, 'MMM dd, yyyy')}
                                </h3>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {getProductionStatusBadge(production)}
                                {extraCells > 0 && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    +{extraCells} {t('production.extraCells')}
                                  </Badge>
                                )}
                                {acceptanceRate !== null && (
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                    {acceptanceRate}% {t('production.acceptance')}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm ml-0 sm:ml-13">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-slate-500" />
                                <span className="text-slate-600">{production.larvaeTransferred} {t('production.larvaeTransferredCount')}</span>
                              </div>

                              {production.acceptedCells !== undefined && (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-slate-600">{production.acceptedCells} {t('production.cellsAccepted')}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-slate-500" />
                                <span className="text-slate-600">{production.cellsProduced} {t('production.cellsProduced')}</span>
                              </div>

                              {production.hives.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <Factory className="h-4 w-4 text-slate-500" />
                                  <span className="text-slate-600">
                                    {t('production.hives')} {production.hives.join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>

                            {production.acceptanceDate && (
                              <div className="mt-2 ml-0 sm:ml-13 text-xs text-slate-500">
                                {t('production.acceptanceRecorded')} {format(production.acceptanceDate, 'MMM dd, yyyy')}
                              </div>
                            )}

                            {relatedOrder && (
                              <div className="mt-3 ml-0 sm:ml-13 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-sm text-blue-700">
                                  <strong>{t('production.relatedOrderLabel')}</strong> {relatedOrder.customerName} - {relatedOrder.numberOfCells} {t('orders.cells')}
                                </p>
                              </div>
                            )}

                            {production.notes && (
                              <div className="mt-3 ml-0 sm:ml-13 flex items-start gap-2">
                                <FileText className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-slate-600">{production.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {production.acceptedCells === undefined && production.status === 'active' && (
                          <div className="ml-0 sm:ml-13">
                            <Button
                              onClick={() => handleRecordAcceptance(production.id)}
                              className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {t('production.recordAcceptedCells')}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="border-slate-200">
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Factory className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 text-lg mb-2">{t('production.noProduction')}</p>
                  <p className="text-slate-400 text-sm mb-4">{t('production.noProductionDesc')}</p>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('production.addFirstProduction')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Accepted Cells Dialog */}
      <Dialog open={showAcceptanceDialog} onOpenChange={setShowAcceptanceDialog}>
        <DialogContent className="border-slate-200 mx-4 sm:mx-0">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-slate-800">{t('production.recordAcceptanceTitle')}</DialogTitle>
                <DialogDescription className="hidden sm:block">
                  {t('production.recordAcceptanceDesc')}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAcceptanceDialog(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="acceptedCells" className="text-slate-700">{t('production.acceptedCells')}</Label>
              <Input
                id="acceptedCells"
                type="number"
                min="0"
                value={acceptedCellsCount}
                onChange={(e) => setAcceptedCellsCount(e.target.value)}
                placeholder={t('production.acceptedCellsPlaceholder')}
                className="border-slate-200 focus:border-blue-400 focus:ring-blue-400"
              />
              <p className="text-xs text-slate-500 mt-1">
                {t('production.acceptedCellsDesc')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={confirmAcceptance}
                disabled={updateAcceptanceMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                {updateAcceptanceMutation.isPending ? t('production.recording') : t('production.recordAcceptanceBtn')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAcceptanceDialog(false)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
              >
                {t('orders.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Production;