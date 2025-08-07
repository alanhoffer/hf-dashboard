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
  // ...
];

let productions: ProductionRecord[] = [
  // ...
];

let stockPackages: StockPackage[] = [];

// Helper functions for case conversion
function toSnakeCase(obj) {
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      result[snakeKey] = obj[key];
    }
  }
  return result;
}

function toCamelCase(obj) {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }

  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/(_\w)/g, (match) => match[1].toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
    }
  }
  return result;
}

// Helper function to get auth headers with token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('No auth token found');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Helper function to check and update expired stock
const updateExpiredStock = () => {
  const now = new Date();

  stockPackages.forEach((pkg) => {
    if (!pkg.isExpired && isAfter(now, pkg.expirationDate) && pkg.availableCells > 0) {
      pkg.isExpired = true;
      pkg.availableCells = 0;

      const productionIndex = productions.findIndex((p) => p.id === pkg.productionId);
      if (productionIndex !== -1) {
        productions[productionIndex].status = 'expired';
      }

      console.log('Stock package expired:', pkg);
    }
  });
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:8000/api';

// Helper function to check if production should be marked as sold
const checkProductionSoldStatus = (productionId) => {
  const production = productions.find((p) => p.id === productionId);
  const stockPackage = stockPackages.find((s) => s.productionId === productionId);

  if (production && stockPackage) {
    const relatedOrder = orders.find((o) => o.id === production.orderId);
    const orderCells = relatedOrder ? relatedOrder.numberOfCells : 0;
    const totalSold = stockPackage.soldCells;
    const totalProduced = production.cellsProduced;

    if (totalSold >= totalProduced - orderCells && stockPackage.availableCells === 0) {
      production.status = 'sold';
      console.log('Production marked as sold:', production);
    }
  }
};

// --- Order management ---
export const getOrders = async () => {
  const res = await fetch(`${API_BASE_URL}/order`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  const data = await res.json();
  const camelCaseData = toCamelCase(data);
  return camelCaseData.map((order) => {
    order.deliveryDate = new Date(order.deliveryDate);
    order.larvaeTransferDate = new Date(order.larvaeTransferDate);
    order.createdAt = new Date(order.createdAt);
    return order;
  });
};

export const getOrderById = async (orderId) => {
  const res = await fetch(`${API_BASE_URL}/order/${orderId}`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch order');
  const order = await res.json();
  const camelCaseOrder = toCamelCase(order);
  camelCaseOrder.deliveryDate = new Date(camelCaseOrder.deliveryDate);
  camelCaseOrder.larvaeTransferDate = new Date(camelCaseOrder.larvaeTransferDate);
  camelCaseOrder.createdAt = new Date(camelCaseOrder.createdAt);
  return camelCaseOrder;
};

export const addOrder = async (orderData) => {
  const payloadCamel = Object.assign({}, orderData);
  payloadCamel.deliveryDate = new Date(orderData.deliveryDate).toISOString().split('T')[0];
  payloadCamel.larvaeTransferDate = new Date(orderData.larvaeTransferDate).toISOString().split('T')[0];

  console.log('Adding order:', payloadCamel);
  const payload = toSnakeCase(payloadCamel);

  const headers = getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/order/`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Failed to add order');
  const newOrder = await res.json();

  const camelCaseNewOrder = toCamelCase(newOrder);
  camelCaseNewOrder.deliveryDate = new Date(camelCaseNewOrder.deliveryDate);
  camelCaseNewOrder.larvaeTransferDate = new Date(camelCaseNewOrder.larvaeTransferDate);
  camelCaseNewOrder.createdAt = new Date(camelCaseNewOrder.createdAt);

  return camelCaseNewOrder;
};

export const updateOrderStatus = async (orderId, status) => {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(toSnakeCase({ status })),
  });
  if (!res.ok) throw new Error('Failed to update order status');
};

// --- Production management ---
export const getProductions = async () => {
  const res = await fetch(`${API_BASE_URL}/productions`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch productions');
  const data = await res.json();

  console.log("data", data)
  const camelCaseData = toCamelCase(data);
  return camelCaseData.map((p) => {
    p.transferDate = new Date(p.transferDate);
    p.acceptanceDate = p.acceptanceDate ? new Date(p.acceptanceDate) : undefined;
    p.createdAt = new Date(p.createdAt);
    return p;
  });
};

export const addProduction = async (productionData) => {
  console.log("addingf", productionData);

  const payloadCamel = { ...productionData };

  // ✅ Formatear fechas a YYYY-MM-DD
  payloadCamel.transferDate = new Date(productionData.transferDate).toISOString().split('T')[0];

  if (productionData.acceptanceDate) {
    payloadCamel.acceptanceDate = new Date(productionData.acceptanceDate).toISOString().split('T')[0];
  }

  // ✅ Convertir hivesUsed (array de strings) a hives (array de objetos con hiveName)
  if (productionData.hives && Array.isArray(productionData.hives)) {
    payloadCamel.hives = productionData.hives.map(name => ({ hiveName: name }));
  }

  // ✅ Eliminar hivesUsed ya que no lo espera el backend
  delete payloadCamel.hives;

  console.log('Adding production:', payloadCamel);

  // ✅ Convertir todo a snake_case
  const payload = toSnakeCase(payloadCamel);

  // ✅ Enviar al backend
  const res = await fetch(`${API_BASE_URL}/productions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Failed to add production');

  const newProduction = await res.json();

  // ✅ Convertir respuesta a camelCase y parsear fechas
  const camelCaseNewProduction = toCamelCase(newProduction);
  camelCaseNewProduction.transferDate = new Date(camelCaseNewProduction.transferDate);
  camelCaseNewProduction.acceptanceDate = camelCaseNewProduction.acceptanceDate
    ? new Date(camelCaseNewProduction.acceptanceDate)
    : undefined;
  camelCaseNewProduction.createdAt = new Date(camelCaseNewProduction.createdAt);

  return camelCaseNewProduction;
};


export const updateAcceptedCells = async (productionId, acceptedCells) => {
  const res = await fetch(`${API_BASE_URL}/productions/${productionId}/acceptance`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(toSnakeCase({ acceptedCells })),
  });
  if (!res.ok) throw new Error('Failed to update accepted cells');
};

// --- Stock management ---
export const getAvailableStock = async () => {
  const res = await fetch(`${API_BASE_URL}/stock`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch stock');
  const data = await res.json();
  console.log(data);
  const camelCaseData = toCamelCase(data);
  return camelCaseData.map((pkg) => {
    pkg.productionDate = new Date(pkg.productionDate);
    pkg.expirationDate = new Date(pkg.expirationDate);
    pkg.createdAt = new Date(pkg.createdAt);
    pkg.sales = pkg.sales.map((sale) => {
      sale.saleDate = new Date(sale.saleDate);
      return sale;
    });
    return pkg;
  });
};

export const sellStockCells = async (packageId, customerName, cellsToSell) => {
  const payload = toSnakeCase({ packageId, customerName, cellsToSell });
  const res = await fetch(`${API_BASE_URL}/stock/sell`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to sell stock cells');
};

export const getDashboardStats = async () => {
  const headers = getAuthHeaders();
  console.log("upcoming", "asd")

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
  const camelCaseStats = toCamelCase(stats);
  const camelCaseUpcoming = toCamelCase(upcomingTransfers);
  const camelCaseExpiring = toCamelCase(expiringStock);


  const parsedUpcomingTransfers = camelCaseUpcoming.map((o) => {
    o.deliveryDate = new Date(o.deliveryDate);
    o.larvaeTransferDate = new Date(o.deliveryDate);
    return o;
  });

  const parsedExpiringStock = camelCaseExpiring.map((pkg) => {
    pkg.productionDate = new Date(pkg.productionDate);
    pkg.expirationDate = new Date(pkg.expirationDate);
    pkg.createdAt = new Date(pkg.createdAt);
    pkg.sales = pkg.sales.map((sale) => {
      sale.saleDate = new Date(sale.saleDate);
      return sale;
    });
    return pkg;
  });

  return {
    pendingOrders: camelCaseStats.pendingOrders,
    totalAvailableCells: camelCaseStats.totalAvailableCells,
    totalSalesLast30Days: camelCaseStats.totalSalesLast30Days,
    upcomingTransfers: parsedUpcomingTransfers,
    expiringStock: parsedExpiringStock,
  };
};

export const getAllStock = async () => {
  console.log('asdasd');

  const res = await fetch(`${API_BASE_URL}/stock/all`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error('Failed to fetch all stock');
  const data = await res.json();
  console.log('2asdasd', data);

  updateExpiredStock();

  const camelCaseData = toCamelCase(data);

  return camelCaseData
    .map((pkg) => {
      pkg.productionDate = new Date(pkg.productionDate);
      pkg.expirationDate = new Date(pkg.expirationDate);
      pkg.createdAt = new Date(pkg.createdAt);
      pkg.sales = pkg.sales.map((sale) => {
        sale.saleDate = new Date(sale.saleDate);
        return sale;
      });
      return pkg;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};