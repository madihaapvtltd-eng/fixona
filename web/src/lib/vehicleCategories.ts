// Vehicle categories for asset classification
export const VEHICLE_CATEGORIES = [
  { value: 'sedan', label: 'Sedan', description: 'Standard passenger car' },
  { value: 'suv', label: 'SUV', description: 'Sport Utility Vehicle' },
  { value: 'pickup', label: 'Pickup Truck', description: 'Light duty pickup truck' },
  { value: 'truck', label: 'Truck', description: 'Heavy duty truck' },
  { value: 'van', label: 'Van', description: 'Passenger or cargo van' },
  { value: 'bus', label: 'Bus', description: 'Passenger bus' },
  { value: 'motorcycle', label: 'Motorcycle', description: 'Two-wheeler vehicle' },
  { value: 'forklift', label: 'Forklift', description: 'Warehouse forklift' },
  { value: 'excavator', label: 'Excavator', description: 'Construction excavator' },
  { value: 'bulldozer', label: 'Bulldozer', description: 'Construction bulldozer' },
  { value: 'crane', label: 'Crane', description: 'Mobile or tower crane' },
  { value: 'generator', label: 'Generator', description: 'Mobile generator set' },
  { value: 'compressor', label: 'Compressor', description: 'Air compressor' },
  { value: 'other', label: 'Other', description: 'Other vehicle type' },
] as const;

export type VehicleCategory = typeof VEHICLE_CATEGORIES[number]['value'];

// Check if an asset is a vehicle type
export function isVehicle(type: string): boolean {
  return type === 'vehicle' || type === 'machinery';
}

// Get vehicle category label
export function getVehicleCategoryLabel(value: string): string {
  const category = VEHICLE_CATEGORIES.find(c => c.value === value);
  return category?.label || value;
}
