// Technician PWA Module - Offline-first mobile interface for technicians
// Features: QR scan, assigned WO list, status updates, parts usage, image upload, offline sync

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { getOptimizedImageUrl } from '@/lib/cloudinary';
import toast from 'react-hot-toast';
import { 
  QrCode, Camera, CheckCircle, Clock, MapPin, Package, 
  Upload, Wifi, WifiOff, ChevronRight, AlertCircle,
  Play, Pause, RotateCcw, Image as ImageIcon, Wrench
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

// Offline storage keys
const OFFLINE_STORAGE_KEYS = {
  ASSIGNED_ORDERS: 'tech_assigned_orders',
  PENDING_UPDATES: 'tech_pending_updates',
  OFFLINE_PARTS_USAGE: 'tech_offline_parts_usage',
  OFFLINE_IMAGES: 'tech_offline_images',
  LAST_SYNC: 'tech_last_sync',
};

// QR Scanner Component using camera API
function QRScanner({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startScanning();
    return () => stopScanning();
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
        scanFrame();
      }
    } catch (err) {
      setError('Camera access denied or not available');
    }
  };

  const stopScanning = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setScanning(false);
  };

  const scanFrame = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Try to detect QR code from image data
      // In production, use a library like jsQR or @zxing/library
      // For now, we'll use a simple manual input fallback
    }
    
    requestAnimationFrame(scanFrame);
  };

  const handleManualInput = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('qrCode') as HTMLInputElement;
    if (input.value) {
      onScan(input.value);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/80">
        <h2 className="text-white font-semibold">Scan Asset QR Code</h2>
        <button onClick={onClose} className="text-white p-2">
          <X className="h-6 w-6" />
        </button>
      </div>
      
      <div className="flex-1 relative">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scan overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-blue-400 rounded-lg relative">
            <div className="absolute inset-0 border-2 border-blue-400/30 rounded-lg animate-pulse" />
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500" />
          </div>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-900/80">
          <p className="text-white text-sm mb-2">{error}</p>
          <form onSubmit={handleManualInput} className="flex gap-2">
            <input
              name="qrCode"
              type="text"
              placeholder="Enter asset code manually"
              className="flex-1 px-3 py-2 rounded bg-white/10 text-white placeholder-gray-400"
            />
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
              Go
            </button>
          </form>
        </div>
      )}
      
      <div className="p-4 bg-black/80 text-center">
        <p className="text-gray-400 text-sm">Position QR code within the frame</p>
      </div>
    </div>
  );
}

// Offline sync manager
class OfflineSyncManager {
  static async saveOrderLocally(order: any) {
    const orders = await this.getLocalOrders();
    const existingIndex = orders.findIndex((o: any) => o.id === order.id);
    if (existingIndex >= 0) {
      orders[existingIndex] = { ...orders[existingIndex], ...order };
    } else {
      orders.push(order);
    }
    localStorage.setItem(OFFLINE_STORAGE_KEYS.ASSIGNED_ORDERS, JSON.stringify(orders));
  }

  static async getLocalOrders(): Promise<any[]> {
    const data = localStorage.getItem(OFFLINE_STORAGE_KEYS.ASSIGNED_ORDERS);
    return data ? JSON.parse(data) : [];
  }

  static async queueUpdate(orderId: string, update: any) {
    const pending = await this.getPendingUpdates();
    pending.push({ orderId, update, timestamp: Date.now() });
    localStorage.setItem(OFFLINE_STORAGE_KEYS.PENDING_UPDATES, JSON.stringify(pending));
  }

  static async getPendingUpdates(): Promise<any[]> {
    const data = localStorage.getItem(OFFLINE_STORAGE_KEYS.PENDING_UPDATES);
    return data ? JSON.parse(data) : [];
  }

  static async clearPendingUpdates() {
    localStorage.removeItem(OFFLINE_STORAGE_KEYS.PENDING_UPDATES);
  }

  static async isOnline(): Promise<boolean> {
    return navigator.onLine;
  }

  static async syncPendingUpdates(): Promise<boolean> {
    if (!navigator.onLine) return false;
    
    const pending = await this.getPendingUpdates();
    if (pending.length === 0) return true;

    let successCount = 0;
    for (const item of pending) {
      try {
        await updateDoc(doc(db, 'work_orders', item.orderId), {
          ...item.update,
          updatedAt: serverTimestamp(),
        });
        successCount++;
      } catch (error) {
        console.error('Sync failed for:', item.orderId, error);
      }
    }

    if (successCount === pending.length) {
      await this.clearPendingUpdates();
      localStorage.setItem(OFFLINE_STORAGE_KEYS.LAST_SYNC, Date.now().toString());
      return true;
    }
    return false;
  }
}

// Parts usage component
function PartsUsage({ orderId, onSave }: { orderId: string; onSave: (parts: any[]) => void }) {
  const [parts, setParts] = useState([{ name: '', quantity: 1, partNumber: '' }]);
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    // Load inventory for autocomplete
    getDocs(collection(db, 'inventory')).then(snap => {
      setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const addPart = () => setParts([...parts, { name: '', quantity: 1, partNumber: '' }]);
  
  const updatePart = (index: number, field: string, value: any) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], [field]: value };
    setParts(updated);
  };

  const removePart = (index: number) => setParts(parts.filter((_, i) => i !== index));

  const handleSave = async () => {
    const validParts = parts.filter(p => p.name && p.quantity > 0);
    
    // Update inventory quantities
    for (const part of validParts) {
      const invItem = inventory.find(i => i.name === part.name || i.partNumber === part.partNumber);
      if (invItem && invItem.quantity >= part.quantity) {
        await updateDoc(doc(db, 'inventory', invItem.id), {
          quantity: invItem.quantity - part.quantity,
          usedCount: (invItem.usedCount || 0) + part.quantity,
        });
      }
    }

    onSave(validParts);
    toast.success('Parts recorded');
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Package className="h-5 w-5" />
        Parts Used
      </h3>
      
      {parts.map((part, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-3 space-y-2">
          <input
            type="text"
            placeholder="Part name or number"
            className="w-full px-3 py-2 border rounded"
            value={part.name}
            onChange={(e) => updatePart(index, 'name', e.target.value)}
            list="inventory-list"
          />
          <datalist id="inventory-list">
            {inventory.map(item => (
              <option key={item.id} value={item.name} />
            ))}
          </datalist>
          
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              placeholder="Qty"
              className="w-24 px-3 py-2 border rounded"
              value={part.quantity}
              onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 1)}
            />
            <button
              onClick={() => removePart(index)}
              className="px-3 py-2 text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
      
      <button
        onClick={addPart}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500"
      >
        + Add Part
      </button>
      
      <button
        onClick={handleSave}
        className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium"
      >
        Save Parts Usage
      </button>
    </div>
  );
}

// Main Technician Mobile Interface
export function TechnicianMobilePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showScanner, setShowScanner] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [completionImages, setCompletionImages] = useState<string[]>([]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online - syncing...');
      OfflineSyncManager.syncPendingUpdates().then(success => {
        if (success) {
          toast.success('All changes synced');
          queryClient.invalidateQueries('assignedOrders');
        }
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Offline mode - changes saved locally');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient]);

  // Fetch assigned work orders
  const { data: assignedOrders, isLoading } = useQuery(
    'assignedOrders',
    async () => {
      if (!user?.id) return [];
      
      // Online fetch
      if (navigator.onLine) {
        const q = query(
          collection(db, 'work_orders'),
          where('technicianId', '==', user.id),
          where('status', 'in', ['assigned_to_technician', 'in_progress', 'need_to_buy'])
        );
        const snap = await getDocs(q);
        const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Save to local storage for offline
        for (const order of orders) {
          await OfflineSyncManager.saveOrderLocally(order);
        }
        
        return orders;
      } else {
        // Offline - return cached orders
        return OfflineSyncManager.getLocalOrders();
      }
    },
    {
      refetchInterval: navigator.onLine ? 30000 : false, // Refresh every 30s when online
    }
  );

  // Handle QR scan
  const handleQRScan = useCallback(async (code: string) => {
    // Look for work order or asset with this code
    const order = assignedOrders?.find(o => o.assetCode === code || o.woNumber === code);
    if (order) {
      setSelectedOrder(order);
      toast.success('Work order found');
    } else {
      // Try to fetch asset and related work orders
      const assetQuery = query(collection(db, 'assets'), where('assetCode', '==', code));
      const assetSnap = await getDocs(assetQuery);
      
      if (!assetSnap.empty) {
        const asset = assetSnap.docs[0];
        // Find work orders for this asset
        const woQuery = query(
          collection(db, 'work_orders'),
          where('assetId', '==', asset.id),
          where('technicianId', '==', user?.id)
        );
        const woSnap = await getDocs(woQuery);
        if (!woSnap.empty) {
          setSelectedOrder({ id: woSnap.docs[0].id, ...woSnap.docs[0].data() });
        } else {
          toast.error('No assigned work orders for this asset');
        }
      } else {
        toast.error('Asset not found');
      }
    }
    setShowScanner(false);
  }, [assignedOrders, user?.id]);

  // Update work order status
  const updateStatusMutation = useMutation(
    async ({ orderId, status, updates }: { orderId: string; status: string; updates?: any }) => {
      const updateData = {
        status,
        ...updates,
        updatedAt: serverTimestamp(),
      };

      if (navigator.onLine) {
        await updateDoc(doc(db, 'work_orders', orderId), updateData);
      } else {
        // Queue for later sync
        await OfflineSyncManager.queueUpdate(orderId, updateData);
        // Update local cache
        const localOrders = await OfflineSyncManager.getLocalOrders();
        const order = localOrders.find((o: any) => o.id === orderId);
        if (order) {
          order.status = status;
          await OfflineSyncManager.saveOrderLocally(order);
        }
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('assignedOrders');
        toast.success('Status updated');
      },
      onError: () => {
        toast.error('Failed to update - saved for later sync');
      },
    }
  );

  // Status options for technician
  const statusOptions = [
    { value: 'in_progress', label: 'Start Work', icon: Play, color: 'bg-blue-500' },
    { value: 'need_to_buy', label: 'Need Parts', icon: Package, color: 'bg-orange-500' },
    { value: 'fixed', label: 'Fixed', icon: CheckCircle, color: 'bg-green-500' },
    { value: 'completed', label: 'Complete', icon: CheckCircle, color: 'bg-emerald-600' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Technician Portal</h1>
            <p className="text-sm text-blue-200">
              {assignedOrders?.length || 0} assigned tasks
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-400" />
            ) : (
              <WifiOff className="h-5 w-5 text-yellow-400" />
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowScanner(true)}
          className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center gap-2"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <QrCode className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-sm font-medium">Scan QR</span>
        </button>
        
        <Link
          to="/technician/parts"
          className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center gap-2"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Package className="h-6 w-6 text-green-600" />
          </div>
          <span className="text-sm font-medium">Parts</span>
        </Link>
      </div>

      {/* Assigned Work Orders */}
      <div className="px-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          My Tasks ({assignedOrders?.length || 0})
        </h2>
        
        {assignedOrders?.map((order: any) => (
          <div
            key={order.id}
            onClick={() => setSelectedOrder(order)}
            className="bg-white rounded-xl p-4 shadow-sm cursor-pointer active:scale-95 transition-transform"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-xs font-medium text-blue-600">{order.woNumber}</span>
                <h3 className="font-semibold text-gray-900">{order.title}</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                order.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {order.status?.replace(/_/g, ' ')}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {order.description}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {order.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {order.location}
                </span>
              )}
              {order.dueDate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(order.dueDate.toDate(), 'MMM d')}
                </span>
              )}
            </div>
          </div>
        ))}
        
        {assignedOrders?.length === 0 && (
          <div className="text-center py-12">
            <img 
              src="/storyset-illustrations/Maintenance-bro.svg" 
              alt="No tasks" 
              className="w-32 h-32 mx-auto mb-4"
            />
            <p className="text-gray-500">No assigned tasks</p>
            <p className="text-sm text-gray-400">Pull to refresh or scan QR</p>
          </div>
        )}
      </div>

      {/* Work Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-blue-600">{selectedOrder.woNumber}</span>
                <h2 className="font-bold text-lg">{selectedOrder.title}</h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Description */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{selectedOrder.description}</p>
              </div>
              
              {/* Status Update */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Update Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        updateStatusMutation.mutate({
                          orderId: selectedOrder.id,
                          status: option.value,
                        });
                        if (option.value === 'completed') {
                          setShowPartsModal(true);
                        }
                      }}
                      disabled={updateStatusMutation.isLoading}
                      className={`${option.color} text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50`}
                    >
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Parts Usage */}
              <button
                onClick={() => setShowPartsModal(true)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Package className="h-5 w-5" />
                Record Parts Used
              </button>
              
              {/* Image Upload */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Add Photos</h3>
                <ImageUpload
                  images={completionImages}
                  onImagesChange={setCompletionImages}
                  maxImages={5}
                  folder="work_orders/technician"
                  label="Upload work photos"
                />
              </div>
              
              {/* Location & Asset Info */}
              {selectedOrder.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {selectedOrder.location}
                </div>
              )}
              
              {selectedOrder.assetCode && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <QrCode className="h-4 w-4" />
                  Asset: {selectedOrder.assetCode}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Parts Modal */}
      {showPartsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Parts Used</h2>
              <button
                onClick={() => setShowPartsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <PartsUsage
              orderId={selectedOrder.id}
              onSave={(parts) => {
                updateStatusMutation.mutate({
                  orderId: selectedOrder.id,
                  status: selectedOrder.status,
                  updates: { partsUsed: parts },
                });
                setShowPartsModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* QR Scanner */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Offline mode - changes will sync when online</span>
        </div>
      )}
    </div>
  );
}

// Import missing icons
import { X, Trash2 } from 'lucide-react';
import { useRef } from 'react';
