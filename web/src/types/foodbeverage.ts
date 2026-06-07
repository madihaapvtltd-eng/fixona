export interface KitchenAsset {
  id: string;
  name: string;
  assetType: 'oven' | 'stove' | 'grill' | 'fryer' | 'refrigerator' | 'freezer' | 'dishwasher' | 'mixer' | 'blender' | 'slicer' | 'coffee-machine' | 'ice-machine' | 'warming-cabinet';
  brand?: string;
  model?: string;
  serialNumber?: string;
  location: string; // kitchen area
  
  // Status
  status: 'operational' | 'maintenance' | 'offline' | 'needs-repair';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Technical
  powerRating?: string;
  fuelType?: 'electric' | 'gas' | 'dual';
  capacity?: string;
  
  // Maintenance
  lastServiceDate?: string;
  nextServiceDue?: string;
  warrantyExpiry?: string;
  
  // Temperature monitoring (for fridges/freezers)
  targetTempMin?: number;
  targetTempMax?: number;
  currentTemp?: number;
  
  companyId: string;
  companyName?: string;
  assignedStaff?: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface RestaurantOutlet {
  id: string;
  name: string;
  outletType: 'main-restaurant' | 'specialty' | 'bar' | 'pool-bar' | 'beach-bar' | 'room-service' | 'buffet' | 'cafe';
  location: string;
  
  // Operating hours
  openingTime: string;
  closingTime: string;
  is24Hours: boolean;
  
  // Capacity
  seatingCapacity: number;
  maxCovers: number; // meals per service
  
  // Status
  status: 'open' | 'closed' | 'seasonal-closure' | 'renovation';
  
  // Staffing
  manager?: string;
  headChef?: string;
  staffCount?: number;
  
  // Menu
  cuisineType?: string[];
  menuItems?: number;
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface FBDailyLog {
  id: string;
  outletId: string;
  outletName: string;
  date: string;
  
  // Covers/Service
  breakfastCovers: number;
  lunchCovers: number;
  dinnerCovers: number;
  totalCovers: number;
  
  // Revenue
  breakfastRevenue: number;
  lunchRevenue: number;
  dinnerRevenue: number;
  beverageRevenue: number;
  totalRevenue: number;
  
  // Special events
  events?: string[];
  complaints?: number;
  compliments?: number;
  
  // Temperature checks
  fridgeTemps?: { location: string; temp: number; time: string }[];
  freezerTemps?: { location: string; temp: number; time: string }[];
  hotHoldTemps?: { location: string; temp: number; time: string }[];
  
  // Staff
  staffPresent: number;
  staffAbsent: number;
  
  recordedBy: string;
  recordedByName: string;
  
  companyId: string;
  companyName?: string;
  notes?: string;
  createdAt?: any;
}

export interface MenuItem {
  id: string;
  outletId: string;
  outletName?: string;
  
  name: string;
  description?: string;
  category: 'appetizer' | 'main' | 'dessert' | 'beverage' | 'breakfast' | 'lunch' | 'dinner' | 'special';
  
  // Pricing
  price: number;
  currency: string;
  costPrice?: number;
  
  // Status
  isActive: boolean;
  isSpecial: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  containsNuts: boolean;
  containsSeafood: boolean;
  
  // Ingredients/Recipe
  ingredients?: string[];
  allergens?: string[];
  preparationTime?: number; // minutes
  
  // Stats
  popularity?: number;
  monthlyOrders?: number;
  
  image?: string;
  
  companyId: string;
  companyName?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Supplier {
  id: string;
  name: string;
  supplierType: 'produce' | 'meat' | 'seafood' | 'dairy' | 'beverages' | 'dry-goods' | 'equipment' | 'linen' | 'cleaning';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  
  // Delivery info
  deliveryDays: string[];
  leadTime: number; // days
  minOrderValue: number;
  
  // Status
  status: 'active' | 'inactive' | 'blacklisted';
  rating?: number;
  
  // Payment
  paymentTerms: string;
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'meat' | 'seafood' | 'produce' | 'dairy' | 'dry-goods' | 'beverages' | 'frozen' | 'bakery' | 'spices' | 'cleaning';
  unit: string;
  
  // Stock
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  
  // Storage
  storageLocation: string;
  storageTemp?: 'frozen' | 'refrigerated' | 'room-temp';
  
  // Supplier
  supplierId?: string;
  supplierName?: string;
  lastOrderDate?: string;
  
  // Tracking
  expiryDate?: string;
  batchNumber?: string;
  
  // Valuation
  unitCost: number;
  totalValue: number;
  
  companyId: string;
  companyName?: string;
  
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export const outletTypeLabels: Record<string, string> = {
  'main-restaurant': 'Main Restaurant',
  'specialty': 'Specialty Restaurant',
  'bar': 'Main Bar',
  'pool-bar': 'Pool Bar',
  'beach-bar': 'Beach Bar',
  'room-service': 'Room Service',
  'buffet': 'Buffet Restaurant',
  'cafe': 'Cafe',
};

export const kitchenAssetTypeLabels: Record<string, string> = {
  'oven': 'Oven',
  'stove': 'Stove/Range',
  'grill': 'Grill',
  'fryer': 'Deep Fryer',
  'refrigerator': 'Refrigerator',
  'freezer': 'Freezer',
  'dishwasher': 'Dishwasher',
  'mixer': 'Stand Mixer',
  'blender': 'Blender',
  'slicer': 'Food Slicer',
  'coffee-machine': 'Coffee Machine',
  'ice-machine': 'Ice Machine',
  'warming-cabinet': 'Warming Cabinet',
};

export const inventoryCategoryLabels: Record<string, string> = {
  'meat': 'Meat & Poultry',
  'seafood': 'Seafood',
  'produce': 'Fresh Produce',
  'dairy': 'Dairy & Eggs',
  'dry-goods': 'Dry Goods',
  'beverages': 'Beverages',
  'frozen': 'Frozen Foods',
  'bakery': 'Bakery Items',
  'spices': 'Spices & Condiments',
  'cleaning': 'Cleaning Supplies',
};
