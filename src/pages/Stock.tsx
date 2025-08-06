import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { getAvailableStock, sellStockCells } from '../services/beeService';
import { Package, Calendar, Factory, ShoppingCart, X, AlertTriangle, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const Stock = () => {
  const { t } = useLanguage();
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [cellsToSell, setCellsToSell] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stockPackages, isLoading } = useQuery({
    queryKey: ['stock'],
    queryFn: getAvailableStock,
  });

  const sellMutation = useMutation({
    mutationFn: ({ packageId, customerName, cellsToSell }: { packageId: string; customerName: string; cellsToSell: number }) =>
      sellStockCells(packageId, customerName, cellsToSell),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      toast({
        title: t('stock.stockSold'),
        description: t('stock.stockSoldDesc'),
      });
      setShowSellDialog(false);
      setSelectedPackage(null);
      setCustomerName('');
      setCellsToSell('');
    },
  });

  const handleSellClick = (packageId: string) => {
    setSelectedPackage(packageId);
    setShowSellDialog(true);
  };

  const confirmSale = () => {
    if (!selectedPackage || !customerName.trim() || !cellsToSell) {
      toast({
        title: t('stock.enterCustomerName'),
        variant: "destructive",
      });
      return;
    }

    const selectedPkg = stockPackages?.find(pkg => pkg.id === selectedPackage);
    const cellsToSellNum = parseInt(cellsToSell);
    
    if (!selectedPkg || cellsToSellNum <= 0 || cellsToSellNum > selectedPkg.availableCells) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid number of cells to sell.",
        variant: "destructive",
      });
      return;
    }

    sellMutation.mutate({
      packageId: selectedPackage,
      customerName: customerName.trim(),
      cellsToSell: cellsToSellNum
    });
  };

  const getDaysUntilExpiration = (expirationDate: Date) => {
    return differenceInDays(expirationDate, new Date());
  };

  const getExpirationBadge = (expirationDate: Date) => {
    const daysLeft = getDaysUntilExpiration(expirationDate);
    
    if (daysLeft <= 1) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">
        <AlertTriangle className="w-3 h-3 mr-1" />
        <span className="hidden sm:inline">Expires {daysLeft === 0 ? 'today' : 'tomorrow'}</span>
        <span className="sm:hidden">{daysLeft === 0 ? 'Today' : '1d'}</span>
      </Badge>;
    } else if (daysLeft <= 3) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">
        <Clock className="w-3 h-3 mr-1" />
        <span className="hidden sm:inline">{daysLeft} days left</span>
        <span className="sm:hidden">{daysLeft}d</span>
      </Badge>;
    }
    
    return <Badge className="bg-green-100 text-green-800 border-green-200">
      <Clock className="w-3 h-3 mr-1" />
      <span className="hidden sm:inline">{daysLeft} days left</span>
      <span className="sm:hidden">{daysLeft}d</span>
    </Badge>;
  };

  const selectedPackageData = stockPackages?.find(pkg => pkg.id === selectedPackage);

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">{t('stock.title')}</h1>
          <p className="text-sm text-slate-600 hidden sm:block">{t('stock.subtitle')}</p>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Card */}
          <Card className="border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="h-4 w-4 text-green-600" />
                </div>
                <span className="hidden sm:inline">{t('stock.extraCells')}</span>
                <span className="sm:hidden">Extra Stock</span>
              </CardTitle>
              <CardDescription className="hidden sm:block">
                {t('stock.extraCellsDesc')}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Stock Packages */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">{t('common.loading')}</div>
            ) : stockPackages && stockPackages.length > 0 ? (
              stockPackages.map((stockPackage) => (
                <Card key={stockPackage.id} className="border-slate-200 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Package className="h-5 w-5 text-green-600" />
                              </div>
                              <h3 className="text-lg font-semibold text-slate-800">
                                <span className="hidden sm:inline">{t('stock.queenCell')} Package - </span>
                                {stockPackage.availableCells} {t('stock.available')}
                              </h3>
                            </div>
                            {getExpirationBadge(stockPackage.expirationDate)}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm ml-0 sm:ml-13">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-500" />
                              <span className="text-slate-600">
                                <span className="hidden sm:inline">{t('stock.produced')} </span>
                                {format(stockPackage.productionDate, 'MMM dd, yyyy')}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Factory className="h-4 w-4 text-slate-500" />
                              <span className="text-slate-600">
                                <span className="hidden sm:inline">{t('stock.origin')} </span>
                                {stockPackage.originHives.join(', ')}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-slate-500" />
                              <span className="text-slate-600">
                                <span className="hidden sm:inline">Total: </span>
                                {stockPackage.totalCells} cells
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4 text-slate-500" />
                              <span className="text-slate-600">
                                <span className="hidden sm:inline">Sold: </span>
                                {stockPackage.soldCells} cells
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-2 ml-0 sm:ml-13 text-xs text-slate-500">
                            <span className="hidden sm:inline">Expires: </span>
                            <span className="sm:hidden">Exp: </span>
                            {format(stockPackage.expirationDate, 'MMM dd, yyyy')}
                          </div>
                          
                          {/* Sales History */}
                          {stockPackage.sales.length > 0 && (
                            <div className="mt-3 ml-0 sm:ml-13">
                              <p className="text-sm font-medium text-slate-700 mb-2">
                                <span className="hidden sm:inline">Recent Sales:</span>
                                <span className="sm:hidden">Sales:</span>
                              </p>
                              <div className="space-y-1">
                                {stockPackage.sales.slice(-3).map((sale) => (
                                  <div key={sale.id} className="text-xs text-slate-600 bg-slate-50 rounded px-2 py-1">
                                    {sale.customerName} - {sale.cellsSold} cells ({format(sale.saleDate, 'MMM dd')})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-0 sm:ml-13">
                        <Button
                          onClick={() => handleSellClick(stockPackage.id)}
                          className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                          disabled={stockPackage.availableCells === 0}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {t('stock.sellCell')}
                        </Button>
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
                  <p className="text-slate-600 text-lg mb-2">{t('stock.noStock')}</p>
                  <p className="text-slate-400 text-sm">{t('stock.noStockDesc')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Sell Dialog */}
      <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
        <DialogContent className="border-slate-200 mx-4 sm:mx-0">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-slate-800">{t('stock.sellQueenCell')}</DialogTitle>
                <DialogDescription className="hidden sm:block">
                  {t('stock.sellDesc')}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSellDialog(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPackageData && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-700">
                  <strong>Available:</strong> {selectedPackageData.availableCells} cells
                </p>
                <p className="text-sm text-slate-700">
                  <strong>Expires:</strong> {format(selectedPackageData.expirationDate, 'MMM dd, yyyy')} 
                  ({getDaysUntilExpiration(selectedPackageData.expirationDate)} days left)
                </p>
              </div>
            )}
            
            <div>
              <Label htmlFor="customerName" className="text-slate-700">Customer Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="border-slate-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
            
            <div>
              <Label htmlFor="cellsToSell" className="text-slate-700">Number of Cells to Sell</Label>
              <Input
                id="cellsToSell"
                type="number"
                min="1"
                max={selectedPackageData?.availableCells || 1}
                value={cellsToSell}
                onChange={(e) => setCellsToSell(e.target.value)}
                placeholder="Enter quantity"
                className="border-slate-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={confirmSale}
                disabled={sellMutation.isPending}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                {sellMutation.isPending ? t('stock.selling') : t('stock.confirmSale')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSellDialog(false)}
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

export default Stock;