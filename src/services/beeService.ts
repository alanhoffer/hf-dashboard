import { addDays, subDays, format, isAfter } from 'date-fns';

export interface CustomerOrder {
  id: string;
  customerName: string;
  numberOfCells: number;
  deliveryDate: Date;
  larvaeTransferDate: Date;
  status: 'pending' | 'in_production' | 'ready' | 'delivered' | 'insufficient' | 'partial';
  createdAt: Date;
}

export interface ProductionRecord {
  id: string;
  transferDate: Date;
  larvaeTransferred: number;
  acceptedCells?: number;
  acceptanceDate?: Date;
  hivesUsed: string[];
  cellsProduced: number;
  orderId?: string;
  notes?: string;
  status?: 'active' | 'sold' | 'expired';
  createdAt: Date;
}

export interface StockPackage {
  id: string;
  productionId: string;
  productionDate: Date;
  totalCells: number;
  availableCells: number;
  soldCells: number;
  originHives: string[];
  expirationDate: Date;
  isExpired: boolean;
  sales: StockSale[];
  createdAt: Date;
}

export interface StockSale {
  id: string;
  customerName: string;
  cellsSold: number;
  saleDate: Date;
}

// In-memory data stores
let orders: CustomerOrder[] = [
  {
    id: '1',
    customerName: 'João Silva',
    numberOfCells: 10,
    deliveryDate: new Date('2024-02-15'),
    larvaeTransferDate: new Date('2024-02-05'),
    status: 'pending',
    createdAt: new Date('2024-01-20')
  },
  {
    id: '2',
    customerName: 'Maria Santos',
    numberOfCells: 5,
    deliveryDate: new Date('2024-02-20'),
    larvaeTransferDate: new Date('2024-02-10'),
    status: 'pending',
    createdAt: new Date('2024-01-25')
  }
];

let productions: ProductionRecord[] = [
  {
    id: '1',
    transferDate: new Date('2024-02-05'),
    larvaeTransferred: 15,
    acceptedCells: 12,
    acceptanceDate: new Date('2024-02-06'),
    hivesUsed: ['Hive A', 'Hive B'],
    cellsProduced: 12,
    orderId: '1',
    status: 'active',
    notes: 'Good larvae quality, 80% acceptance rate',
    createdAt: new Date('2024-02-05')
  }
];

let stockPackages: StockPackage[] = [];

// Helper function to get auth headers with token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('No auth token found');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Helper function to check and update expired stock
const updateExpiredStock = () => {
  const now = new Date();
  
  stockPackages.forEach(pkg => {
    if (!pkg.isExpired && isAfter(now, pkg.expirationDate) && pkg.availableCells > 0) {
      pkg.isExpired = true;
      pkg.availableCells = 0;
      
      // Update related production status
      const productionIndex = productions.findIndex(p => p.id === pkg.productionId);
      if (productionIndex !== -1) {
        productions[productionIndex].status = 'expired';
      }
      
      console.log('Stock package expired:', pkg);
    }
  });
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Helper function to check if production should be marked as sold
const checkProductionSoldStatus = (productionId: string) => {
  const production = productions.find(p => p.id === productionId);
  const stockPackage = stockPackages.find(s => s.productionId === productionId);
  
  if (production && stockPackage) {
    const relatedOrder = orders.find(o => o.id === production.orderId);
    const orderCells = relatedOrder ? relatedOrder.numberOfCells : 0;
    const totalSold = stockPackage.soldCells;
    const totalProduced = production.cellsProduced;
    
    // If all cells (order + extra) are sold, mark production as sold
    if (totalSold >= (totalProduced - orderCells) && stockPackage.availableCells === 0) {
      production.status = 'sold';
      console.log('Production marked as sold:', production);
    }
  }
};

// Order management
export const getOrders = async (): Promise<CustomerOrder[]> => {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  const data = await res.json();
  return data.map((order: any) => ({
    ...order,
    deliveryDate: new Date(order.deliveryDate),
    larvaeTransferDate: new Date(order.larvaeTransferDate),
    createdAt: new Date(order.createdAt),
  }));
};

export const getOrderById = async (orderId: string): Promise<CustomerOrder | null> => {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch order');
  const order = await res.json();
  return {
    ...order,
    deliveryDate: new Date(order.deliveryDate),
    larvaeTransferDate: new Date(order.larvaeTransferDate),
    createdAt: new Date(order.createdAt),
  };
};

export const addOrder = async (orderData: Omit<CustomerOrder, 'id' | 'larvaeTransferDate' | 'status' | 'createdAt'>): Promise<CustomerOrder> => {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(orderData),
  });
  if (!res.ok) throw new Error('Failed to add order');
  const newOrder = await res.json();
  return {
    ...newOrder,
    deliveryDate: new Date(newOrder.deliveryDate),
    larvaeTransferDate: new Date(newOrder.larvaeTransferDate),
    createdAt: new Date(newOrder.createdAt),
  };
};

export const updateOrderStatus = async (orderId: string, status: CustomerOrder['status']): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update order status');
};

export const getProductions = async (): Promise<ProductionRecord[]> => {
  const res = await fetch(`${API_BASE_URL}/productions`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch productions');
  const data = await res.json();
  return data.map((p: any) => ({
    ...p,
    transferDate: new Date(p.transferDate),
    acceptanceDate: p.acceptanceDate ? new Date(p.acceptanceDate) : undefined,
    createdAt: new Date(p.createdAt),
  }));
};

export const addProduction = async (productionData: Omit<ProductionRecord, 'id' | 'createdAt' | 'status'>): Promise<ProductionRecord> => {
  const res = await fetch(`${API_BASE_URL}/productions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(productionData),
  });
  if (!res.ok) throw new Error('Failed to add production');
  const newProduction = await res.json();
  return {
    ...newProduction,
    transferDate: new Date(newProduction.transferDate),
    acceptanceDate: newProduction.acceptanceDate ? new Date(newProduction.acceptanceDate) : undefined,
    createdAt: new Date(newProduction.createdAt),
  };
};

export const updateAcceptedCells = async (productionId: string, acceptedCells: number): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/productions/${productionId}/acceptance`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ accepted_cells: acceptedCells }),
  });
  if (!res.ok) throw new Error('Failed to update accepted cells');
};

export const getAvailableStock = async (): Promise<StockPackage[]> => {
  const res = await fetch(`${API_BASE_URL}/stock`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch stock');
  const data = await res.json();
  return data.map((pkg: any) => ({
    ...pkg,
    productionDate: new Date(pkg.productionDate),
    expirationDate: new Date(pkg.expirationDate),
    createdAt: new Date(pkg.createdAt),
    sales: pkg.sales.map((sale: any) => ({
      ...sale,
      saleDate: new Date(sale.saleDate),
    })),
  }));
};

export const sellStockCells = async (packageId: string, customerName: string, cellsToSell: number): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/stock/sell`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ package_id: packageId, customer_name: customerName, cells_to_sell: cellsToSell }),
  });
  if (!res.ok) throw new Error('Failed to sell stock cells');
};

export const getDashboardStats = async () => {
  const headers = getAuthHeaders();

  const [statsRes, upcomingRes, expiringRes] = await Promise.all([
    fetch(`${API_BASE_URL}/dashboard/stats`, { headers }),
    fetch(`${API_BASE_URL}/dashboard/upcoming`, { headers }),
    fetch(`${API_BASE_URL}/dashboard/expiring`, { headers }),
  ]);

  if (!statsRes.ok) throw new Error('Failed to fetch dashboard stats');
  if (!upcomingRes.ok) throw new Error('Failed to fetch upcoming transfers');
  if (!expiringRes.ok) throw new Error('Failed to fetch expiring stock');

  const [stats, upcomingTransfers, expiringStock] = await Promise.all([
    statsRes.json(),
    upcomingRes.json(),
    expiringRes.json(),
  ]);

  const parsedUpcomingTransfers = upcomingTransfers.map((o: any) => ({
    ...o,
    deliveryDate: new Date(o.deliveryDate),
    larvaeTransferDate: new Date(o.larvaeTransferDate),
  }));

  const parsedExpiringStock = expiringStock.map((pkg: any) => ({
    ...pkg,
    productionDate: new Date(pkg.productionDate),
    expirationDate: new Date(pkg.expirationDate),
    createdAt: new Date(pkg.createdAt),
    sales: pkg.sales.map((sale: any) => ({
      ...sale,
      saleDate: new Date(sale.saleDate),
    })),
  }));

  return {
    ...stats,
    upcomingTransfers: parsedUpcomingTransfers,
    expiringStock: parsedExpiringStock,
  };
};

export const getAllStock = async (): Promise<StockPackage[]> => {
  const res = await fetch(`${API_BASE_URL}/stock/all`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch all stock');
  const data = await res.json();

  // Actualizar expirados localmente
  updateExpiredStock();

  return data
    .map((pkg: any) => ({
      ...pkg,
      productionDate: new Date(pkg.productionDate),
      expirationDate: new Date(pkg.expirationDate),
      createdAt: new Date(pkg.createdAt),
      sales: pkg.sales.map((sale: any) => ({
        ...sale,
        saleDate: new Date(sale.saleDate),
      })),
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};
