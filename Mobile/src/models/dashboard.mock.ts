import { DashboardStats } from './DashboardStats';
import { ProductAlert } from './Product';

export const MOCK_STATS: DashboardStats = {
totalProducts: 49,
lowStock: 6,
outOfStock: 2,
todayOrders: 12,
};

export const MOCK_ALERTS: ProductAlert[] = [
{
id: '1',
name: 'Ethiopia Yirgacheffe',
category: 'Beans',
stock: 2,
minStock: 10,
unit: 'kg',
},
{
id: '2',
name: 'Oat Milk Barista',
category: 'Dairy alt.',
stock: 0,
minStock: 8,
unit: 'L',
},
{
id: '3',
name: 'Paper Cups 12oz',
category: 'Packaging',
stock: 45,
minStock: 100,
unit: 'pcs',
},
{
id: '4',
name: 'Colombia Supremo',
category: 'Beans',
stock: 5,
minStock: 12,
unit: 'kg',
},
];