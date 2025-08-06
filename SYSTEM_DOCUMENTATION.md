# Queen Cell Management System - Technical Documentation

## Overview
A comprehensive web application for managing bee queen cell production and sales, built with React, TypeScript, and modern web technologies.

## Technology Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: ShadCN/UI + Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM v7
- **Authentication**: Context-based with localStorage
- **Export**: jsPDF + xlsx for PDF/Excel generation
- **Icons**: Lucide React

## System Architecture

### Authentication System
- **Login Component**: `src/components/LoginForm.tsx`
- **Auth Context**: `src/contexts/AuthContext.tsx`
- **Password**: `beekeeper2024` (demo - should be properly hashed in production)
- **Session**: Stored in localStorage as `bee-auth`

### Data Management
- **Service Layer**: `src/services/beeService.ts`
- **In-Memory Storage**: Arrays for orders, productions, and stock
- **Export Utilities**: `src/utils/exportUtils.ts`

### Core Components
1. **Dashboard** (`src/pages/Dashboard.tsx`)
2. **Orders Management** (`src/pages/Orders.tsx`)
3. **Production Records** (`src/pages/Production.tsx`)
4. **Stock Management** (`src/pages/Stock.tsx`)
5. **History & Reports** (`src/pages/History.tsx`)

## Database Schema (For Production Implementation)

### Tables Required

#### 1. users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. customer_orders
```sql
CREATE TABLE customer_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(100) NOT NULL,
    number_of_cells INTEGER NOT NULL,
    delivery_date DATE NOT NULL,
    larvae_transfer_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_production', 'ready', 'delivered')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES users(id)
);
```

#### 3. production_records
```sql
CREATE TABLE production_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_date DATE NOT NULL,
    larvae_transferred INTEGER NOT NULL,
    accepted_cells INTEGER,
    acceptance_date DATE,
    cells_produced INTEGER NOT NULL,
    hives_used TEXT[], -- Array of hive names
    order_id UUID REFERENCES customer_orders(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES users(id)
);
```

#### 4. stock_items
```sql
CREATE TABLE stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID REFERENCES production_records(id),
    production_date DATE NOT NULL,
    origin_hive VARCHAR(50) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    sold_date DATE,
    sold_to VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES users(id)
);
```

#### 5. hives (Optional - for hive management)
```sql
CREATE TABLE hives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES users(id)
);
```

## API Endpoints (For Backend Implementation)

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Orders Management
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `PATCH /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order

### Production Management
- `GET /api/productions` - Get all production records
- `POST /api/productions` - Create production record
- `PUT /api/productions/:id` - Update production record
- `PATCH /api/productions/:id/acceptance` - Update accepted cells
- `DELETE /api/productions/:id` - Delete production record

### Stock Management
- `GET /api/stock` - Get available stock
- `GET /api/stock/all` - Get all stock (including sold)
- `PATCH /api/stock/:id/sell` - Mark stock item as sold
- `DELETE /api/stock/:id` - Remove stock item

### Dashboard & Analytics
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/analytics/acceptance-rates` - Get acceptance rate analytics
- `GET /api/analytics/production-trends` - Get production trends

### Export
- `GET /api/export/orders` - Export orders (PDF/Excel)
- `GET /api/export/productions` - Export production records
- `GET /api/export/stock` - Export stock data

## Data Models (TypeScript Interfaces)

### CustomerOrder
```typescript
interface CustomerOrder {
  id: string;
  customerName: string;
  numberOfCells: number;
  deliveryDate: Date;
  larvaeTransferDate: Date;
  status: 'pending' | 'in_production' | 'ready' | 'delivered';
  createdAt: Date;
}
```

### ProductionRecord
```typescript
interface ProductionRecord {
  id: string;
  transferDate: Date;
  larvaeTransferred: number;
  acceptedCells?: number;
  acceptanceDate?: Date;
  hivesUsed: string[];
  cellsProduced: number;
  orderId?: string;
  notes?: string;
  createdAt: Date;
}
```

### StockItem
```typescript
interface StockItem {
  id: string;
  productionId: string;
  productionDate: Date;
  originHive: string;
  isAvailable: boolean;
  soldDate?: Date;
  soldTo?: string;
}
```

## Key Features

### 1. Order Management
- Customer order registration
- Automatic larvae transfer date calculation (10 days before delivery)
- Order status tracking (pending → in_production → ready → delivered)
- Order history and search

### 2. Production Tracking
- **Larvae Transfer Recording**: Initial larvae count
- **Acceptance Tracking**: Survival count after transfer (NEW FEATURE)
- **Final Production**: Mature queen cells produced
- **Acceptance Rate Calculation**: Automatic percentage calculation
- Hive tracking and notes

### 3. Stock Management
- Automatic extra cell detection
- Stock availability tracking
- Sales recording with customer information

### 4. Analytics & Reporting
- Dashboard with key metrics
- Acceptance rate analytics
- Production trends
- Upcoming transfer alerts

### 5. Data Export
- PDF reports for orders and production
- Excel exports for data analysis
- Professional formatting

### 6. Security & Access
- Password-protected access
- Session management
- User authentication context

## Mobile Responsiveness
- Responsive grid layouts
- Touch-friendly interfaces
- Mobile-optimized forms
- Sidebar navigation for mobile

## Performance Optimizations
- React Query for efficient data fetching
- Lazy loading of components
- Optimized re-renders with proper dependencies
- Efficient state management

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Dependencies
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.6.0",
    "@tanstack/react-query": "^5.76.0",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.510.0",
    "jspdf": "latest",
    "jspdf-autotable": "latest",
    "xlsx": "latest",
    "@radix-ui/react-*": "various versions",
    "tailwindcss": "^3.x",
    "typescript": "^5.x"
  }
}
```

## Production Deployment Considerations

### Environment Variables
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_NAME=Queen Cell Manager
VITE_APP_VERSION=1.0.0
```

### Security Enhancements
1. Implement proper JWT authentication
2. Add password hashing (bcrypt)
3. Add rate limiting
4. Implement HTTPS
5. Add input validation and sanitization
6. Add CSRF protection

### Database Considerations
1. Add proper indexes for performance
2. Implement database migrations
3. Add backup strategies
4. Consider read replicas for analytics

### Monitoring & Logging
1. Add application logging
2. Implement error tracking (Sentry)
3. Add performance monitoring
4. Database query monitoring

## Future Enhancements

### Planned Features
1. **Multi-user Support**: Multiple beekeepers
2. **Advanced Analytics**: Charts and graphs
3. **Notification System**: Email/SMS alerts
4. **Inventory Management**: Equipment and supplies
5. **Financial Tracking**: Revenue and cost analysis
6. **API Integration**: Weather data, market prices
7. **Mobile App**: Native iOS/Android apps
8. **Backup & Sync**: Cloud data synchronization

### Technical Improvements
1. **Offline Support**: PWA capabilities
2. **Real-time Updates**: WebSocket integration
3. **Advanced Search**: Full-text search
4. **Bulk Operations**: Mass data import/export
5. **Audit Trail**: Change tracking
6. **Data Validation**: Enhanced form validation
7. **Performance**: Virtual scrolling for large datasets
8. **Accessibility**: WCAG compliance

This documentation provides a complete overview of the Queen Cell Management System, including all necessary technical details for development, deployment, and future enhancements.