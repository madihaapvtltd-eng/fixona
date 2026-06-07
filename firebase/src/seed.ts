import { db } from './index';
import * as admin from 'firebase-admin';

// Sample data for seeding the database
const sampleLocations = [
  { name: 'Main Building', code: 'MB', type: 'building', isActive: true },
  { name: 'Factory Floor 1', code: 'FF1', type: 'floor', parentId: 'main-building', isActive: true },
  { name: 'Factory Floor 2', code: 'FF2', type: 'floor', parentId: 'main-building', isActive: true },
  { name: 'Warehouse A', code: 'WH-A', type: 'area', isActive: true },
  { name: 'Server Room', code: 'SR-01', type: 'room', parentId: 'main-building', isActive: true },
];

const sampleAssets = [
  {
    name: 'HVAC Unit 1',
    assetCode: 'HVAC-001',
    category: 'HVAC',
    status: 'operational',
    condition: 'good',
    riskLevel: 'low',
    manufacturer: 'Carrier',
    model: '30RB-0804',
    purchaseDate: new Date('2020-03-15'),
    maintenanceInterval: 90,
    nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  },
  {
    name: 'Air Compressor A',
    assetCode: 'COMP-001',
    category: 'Mechanical',
    status: 'operational',
    condition: 'fair',
    riskLevel: 'medium',
    manufacturer: 'Atlas Copco',
    model: 'GA75',
    purchaseDate: new Date('2019-06-20'),
    failureCount: 2,
    maintenanceInterval: 60,
    nextMaintenanceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days overdue
  },
  {
    name: 'Backup Generator',
    assetCode: 'GEN-001',
    category: 'Electrical',
    status: 'operational',
    condition: 'excellent',
    riskLevel: 'low',
    manufacturer: 'Cummins',
    model: 'C150D6',
    purchaseDate: new Date('2021-01-10'),
    maintenanceInterval: 180,
    nextMaintenanceDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  },
  {
    name: 'CNC Machine 1',
    assetCode: 'CNC-001',
    category: 'Production',
    status: 'maintenance',
    condition: 'poor',
    riskLevel: 'high',
    manufacturer: 'Haas',
    model: 'VF-2',
    purchaseDate: new Date('2018-11-05'),
    downtimeHours: 120,
    failureCount: 5,
    maintenanceInterval: 30,
    nextMaintenanceDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    name: 'Forklift 1',
    assetCode: 'FL-001',
    category: 'Vehicles',
    status: 'operational',
    condition: 'good',
    riskLevel: 'medium',
    manufacturer: 'Toyota',
    model: '8FGCU25',
    purchaseDate: new Date('2020-08-12'),
    maintenanceInterval: 120,
    nextMaintenanceDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  },
];

const sampleInventory = [
  {
    partNumber: 'FIL-001',
    name: 'Air Filter 20x20x1',
    category: 'HVAC',
    quantity: 25,
    minThreshold: 10,
    reorderPoint: 15,
    unitCost: 12.99,
    unitOfMeasure: 'each',
    storageLocation: 'Shelf A-12',
    supplierName: 'HVAC Supply Co',
    leadTime: 7,
  },
  {
    partNumber: 'OIL-001',
    name: 'Compressor Oil SAE 30',
    category: 'Mechanical',
    quantity: 8,
    minThreshold: 5,
    reorderPoint: 8,
    unitCost: 45.50,
    unitOfMeasure: 'liter',
    storageLocation: 'Shelf B-05',
    supplierName: 'Industrial Fluids Inc',
    leadTime: 14,
  },
  {
    partNumber: 'BEL-001',
    name: 'V-Belt A68',
    category: 'Mechanical',
    quantity: 12,
    minThreshold: 5,
    reorderPoint: 8,
    unitCost: 18.75,
    unitOfMeasure: 'each',
    storageLocation: 'Shelf C-03',
    supplierName: 'Power Transmission Co',
    leadTime: 10,
  },
  {
    partNumber: 'BEA-001',
    name: 'Ball Bearing 6205-2RS',
    category: 'Mechanical',
    quantity: 30,
    minThreshold: 10,
    reorderPoint: 15,
    unitCost: 8.25,
    unitOfMeasure: 'each',
    storageLocation: 'Shelf D-08',
    supplierName: 'Bearing Supply Ltd',
    leadTime: 5,
  },
  {
    partNumber: 'ELE-001',
    name: 'Fuse 15A',
    category: 'Electrical',
    quantity: 50,
    minThreshold: 20,
    reorderPoint: 30,
    unitCost: 2.50,
    unitOfMeasure: 'pack',
    storageLocation: 'Shelf E-01',
    supplierName: 'Electrical Wholesale',
    leadTime: 3,
  },
  {
    partNumber: 'FIL-002',
    name: 'Oil Filter Spin-on',
    category: 'Vehicles',
    quantity: 3,
    minThreshold: 5,
    reorderPoint: 8,
    unitCost: 15.00,
    unitOfMeasure: 'each',
    storageLocation: 'Shelf F-02',
    supplierName: 'Auto Parts Plus',
    leadTime: 7,
  },
];

const sampleSuppliers = [
  { name: 'HVAC Supply Co', contactPerson: 'John Smith', email: 'john@hvacsupply.com', phone: '+1-555-0101', isActive: true },
  { name: 'Industrial Fluids Inc', contactPerson: 'Jane Doe', email: 'jane@industrialfluids.com', phone: '+1-555-0102', isActive: true },
  { name: 'Power Transmission Co', contactPerson: 'Bob Wilson', email: 'bob@powertrans.com', phone: '+1-555-0103', isActive: true },
  { name: 'Bearing Supply Ltd', contactPerson: 'Alice Brown', email: 'alice@bearings.com', phone: '+1-555-0104', isActive: true },
  { name: 'Electrical Wholesale', contactPerson: 'Charlie Davis', email: 'charlie@elecwholesale.com', phone: '+1-555-0105', isActive: true },
  { name: 'Auto Parts Plus', contactPerson: 'Diana Miller', email: 'diana@autoparts.com', phone: '+1-555-0106', isActive: true },
];

async function seedDatabase() {
  console.log('Starting database seeding...');
  
  try {
    // Add locations
    console.log('Adding locations...');
    const locationRefs: Record<string, string> = {};
    for (const location of sampleLocations) {
      const ref = db.collection('locations').doc();
      await ref.set({
        ...location,
        id: ref.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      locationRefs[location.code] = ref.id;
    }
    
    // Update parent IDs for locations
    for (const [code, id] of Object.entries(locationRefs)) {
      const location = sampleLocations.find(l => l.code === code);
      if (location?.parentId && locationRefs[location.parentId]) {
        await db.collection('locations').doc(id).update({
          parentId: locationRefs[location.parentId],
        });
      }
    }
    
    // Add suppliers
    console.log('Adding suppliers...');
    const supplierRefs: Record<string, string> = {};
    for (const supplier of sampleSuppliers) {
      const ref = db.collection('suppliers').doc();
      await ref.set({
        ...supplier,
        id: ref.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      supplierRefs[supplier.name] = ref.id;
    }
    
    // Add inventory
    console.log('Adding inventory...');
    for (const item of sampleInventory) {
      const ref = db.collection('inventory').doc();
      await ref.set({
        ...item,
        id: ref.id,
        supplierId: supplierRefs[item.supplierName] || null,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    // Add assets
    console.log('Adding assets...');
    const locationIds = Object.values(locationRefs);
    for (let i = 0; i < sampleAssets.length; i++) {
      const asset = sampleAssets[i];
      const ref = db.collection('assets').doc();
      await ref.set({
        ...asset,
        id: ref.id,
        locationId: locationIds[i % locationIds.length],
        totalMaintenanceCost: 0,
        downtimeHours: asset.downtimeHours || 0,
        failureCount: asset.failureCount || 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    console.log('Database seeding completed successfully!');
    console.log(`Added ${sampleLocations.length} locations`);
    console.log(`Added ${sampleSuppliers.length} suppliers`);
    console.log(`Added ${sampleInventory.length} inventory items`);
    console.log(`Added ${sampleAssets.length} assets`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };
