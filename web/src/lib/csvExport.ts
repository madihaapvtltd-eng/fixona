// CSV Export Utility for Work Orders, Inventory, and Maintenance Logs

export function downloadCSV(filename: string, rows: any[]) {
  if (rows.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first row keys
  const headers = Object.keys(rows[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...rows.map(row => 
      headers.map(header => {
        let cell = row[header];
        
        // Handle null/undefined
        if (cell == null) return '';
        
        // Handle dates
        if (cell?.toDate) {
          cell = cell.toDate().toISOString();
        } else if (cell instanceof Date) {
          cell = cell.toISOString();
        }
        
        // Convert to string and escape
        cell = String(cell);
        
        // Escape quotes and wrap in quotes if contains comma or newline
        if (cell.includes('"') || cell.includes(',') || cell.includes('\n')) {
          cell = '"' + cell.replace(/"/g, '""') + '"';
        }
        
        return cell;
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// Export work orders to CSV
export function exportWorkOrdersToCSV(workOrders: any[]) {
  const flattened = workOrders.map(wo => ({
    'WO Number': wo.woNumber,
    'Title': wo.title,
    'Description': wo.description,
    'Status': wo.status,
    'Priority': wo.priority,
    'Work Type': wo.workType,
    'Department': wo.department,
    'Location': wo.location,
    'Asset Code': wo.assetCode,
    'Assigned To': wo.assignedToName || wo.technicianName || 'Unassigned',
    'Created Date': wo.createdAt?.toDate?.() || wo.createdAt,
    'Due Date': wo.dueDate?.toDate?.() || wo.dueDate,
    'Completed Date': wo.completedAt?.toDate?.() || wo.completedAt,
    'Cost (MVR)': wo.cost || 0,
    'Labor Cost': wo.laborCost || 0,
    'Parts Cost': wo.partsCost || 0,
    'Purchase Cost': wo.purchaseCost || 0,
    'AI Generated': wo.aiGenerated ? 'Yes' : 'No',
  }));
  
  const date = new Date().toISOString().split('T')[0];
  downloadCSV(`work-orders-${date}.csv`, flattened);
}

// Export inventory to CSV
export function exportInventoryToCSV(inventory: any[]) {
  const flattened = inventory.map(item => ({
    'Item Name': item.name,
    'Part Number': item.partNumber,
    'Category': item.category,
    'Location': item.location,
    'Current Stock': item.quantity,
    'Min Stock': item.minStock,
    'Max Stock': item.maxStock,
    'Unit Cost (MVR)': item.unitCost,
    'Total Value': (item.quantity || 0) * (item.unitCost || 0),
    'Supplier': item.supplier,
    'Status': item.quantity === 0 ? 'Out of Stock' : 
              item.quantity <= (item.minStock || 0) ? 'Low Stock' : 'In Stock',
    'Last Restocked': item.lastRestocked?.toDate?.() || item.lastRestocked,
  }));
  
  const date = new Date().toISOString().split('T')[0];
  downloadCSV(`inventory-${date}.csv`, flattened);
}

// Export assets to CSV
export function exportAssetsToCSV(assets: any[]) {
  const flattened = assets.map(asset => ({
    'Asset Code': asset.assetCode,
    'Name': asset.name,
    'Type': asset.type,
    'Department': asset.department,
    'Location': asset.location,
    'Status': asset.status,
    'Criticality': asset.criticality,
    'Purchase Date': asset.purchaseDate?.toDate?.() || asset.purchaseDate,
    'Warranty Expiry': asset.warrantyExpiry?.toDate?.() || asset.warrantyExpiry,
    'Last Maintenance': asset.lastMaintenance?.toDate?.() || asset.lastMaintenance,
    'Next PM Due': asset.nextPmDate?.toDate?.() || asset.nextPmDate,
    'Failure Count': asset.failureCount || 0,
  }));
  
  const date = new Date().toISOString().split('T')[0];
  downloadCSV(`assets-${date}.csv`, flattened);
}

// Export maintenance logs to CSV
export async function exportMaintenanceLogsToCSV(workOrders: any[]) {
  const flattened = workOrders
    .filter(wo => wo.status === 'completed' || wo.status === 'closed')
    .map(wo => ({
      'WO Number': wo.woNumber,
      'Asset Code': wo.assetCode,
      'Asset Name': wo.assetName,
      'Work Type': wo.workType,
      'Description': wo.description,
      'Technician': wo.technicianName || wo.assignedToName,
      'Started': wo.startedAt?.toDate?.() || wo.startedAt,
      'Completed': wo.completedAt?.toDate?.() || wo.completedAt,
      'Duration (Hours)': wo.duration || calculateDuration(wo.startedAt, wo.completedAt),
      'Labor Cost': wo.laborCost || 0,
      'Parts Used': wo.partsUsed?.map((p: any) => `${p.name} (${p.quantity})`).join('; ') || '',
      'Parts Cost': wo.partsCost || 0,
      'Root Cause': wo.rootCause || '',
      'Solution': wo.solution || '',
    }));
  
  const date = new Date().toISOString().split('T')[0];
  downloadCSV(`maintenance-logs-${date}.csv`, flattened);
}

// Helper function
function calculateDuration(startedAt: any, completedAt: any): number {
  if (!startedAt || !completedAt) return 0;
  const start = startedAt.toDate ? startedAt.toDate() : new Date(startedAt);
  const end = completedAt.toDate ? completedAt.toDate() : new Date(completedAt);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60) * 10) / 10;
}
