export interface InventoryItem {
  id: string;
  partNumber: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  manufacturer?: string;
  quantity: number;
  minThreshold: number;
  maxThreshold?: number;
  reorderPoint: number;
  unitCost: number;
  unitOfMeasure: string;
  location?: string;
  storageLocation?: string;
  supplierId?: string;
  supplierName?: string;
  supplierPartNumber?: string;
  leadTime?: number;
  imageUrl?: string;
  barcode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryLog {
  id: string;
  partId: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType?: 'work_order' | 'purchase' | 'return' | 'adjustment' | 'transfer';
  referenceId?: string;
  notes?: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  expectedDelivery?: Date;
  actualDelivery?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  partId: string;
  name: string;
  quantity: number;
  unitCost: number;
  receivedQuantity: number;
  totalCost: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  paymentTerms?: string;
  leadTime?: number;
  rating?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
