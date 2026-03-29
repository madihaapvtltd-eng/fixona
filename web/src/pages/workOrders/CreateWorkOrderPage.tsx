import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ALL_LOCATIONS } from '@/lib/locations';
import { DEPARTMENTS } from '@/lib/departments';
import { WORK_TYPES, getWorkTypeLabel } from '@/lib/workTypes';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Palette, Wrench, Monitor, Megaphone, ShoppingCart, Users, Calculator, Clipboard, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

const WORK_TYPE_ICONS: Record<string, any> = {
  maintenance: Wrench,
  it: Monitor,
  graphic_design: Palette,
  marketing: Megaphone,
  purchasing: ShoppingCart,
  hr: Users,
  accounts: Calculator,
  general: Clipboard,
};

export function CreateWorkOrderPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [workType, setWorkType] = useState('maintenance');
  const [dynamicLocations, setDynamicLocations] = useState<any[]>([]);
  const [dynamicDepartments, setDynamicDepartments] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assetId: '',
    location: '',
    department: '',
    priority: 'medium',
    dueDate: '',
  });
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const locSnap = await getDocs(collection(db, 'settings', 'locations', 'items'));
        const loadedLocations = locSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('WorkOrder: Loaded locations:', loadedLocations.length, loadedLocations);
        setDynamicLocations(loadedLocations);
        
        const deptSnap = await getDocs(collection(db, 'settings', 'departments', 'items'));
        setDynamicDepartments(deptSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        // Load assets for optional selection
        const assetsSnap = await getDocs(collection(db, 'assets'));
        setAssets(assetsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load locations/departments');
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const workTypeConfig = WORK_TYPES[workType as keyof typeof WORK_TYPES];
    if (workTypeConfig?.departments?.[0]) {
      setFormData(prev => ({ ...prev, department: workTypeConfig.departments[0] }));
    }
  }, [workType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const woNumber = `WO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      await addDoc(collection(db, 'work_orders'), {
        ...formData,
        woNumber,
        workType,
        workTypeLabel: getWorkTypeLabel(workType),
        status: 'raised',
        cost: 0,
        laborCost: 0,
        partsCost: 0,
        purchaseCost: 0,
        images: images,
        attachments: [],
        partsUsed: [],
        purchaseItems: [],
        createdBy: user?.id || 'unknown',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
      });
      toast.success(`${getWorkTypeLabel(workType)} request created`);
      navigate('/work-orders');
    } catch (error) {
      toast.error('Failed to create');
    } finally {
      setLoading(false);
    }
  };

  const workTypeConfig = WORK_TYPES[workType as keyof typeof WORK_TYPES];
  // Combine dynamic locations from Firebase with static ones
  const allLocations = [...dynamicLocations, ...ALL_LOCATIONS];
  const allDepartments = dynamicDepartments.length > 0 ? dynamicDepartments : DEPARTMENTS;

  const getLocationOptionLabel = (loc: any) => {
    const type = typeof loc?.type === 'string' && loc.type.trim() ? loc.type.trim() : '';
    const label = loc?.label ?? '';
    return type ? `${type.charAt(0).toUpperCase()}${type.slice(1)} - ${label}` : label;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/work-orders" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold">Create Work Request</h1>
      </div>

      {/* Work Type Selection */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <label className="label font-semibold mb-4">Select Work Type</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(WORK_TYPES).map(([key, config]) => {
            const Icon = WORK_TYPE_ICONS[key] || Clipboard;
            const isSelected = workType === key;
            return (
              <button
                key={key}
                onClick={() => setWorkType(key)}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  isSelected ? `${config.color} text-white border-transparent shadow-lg` : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
        {/* Asset Selection */}
        <div>
          <label className="label flex items-center gap-2">
            <Package className="h-4 w-4" />
            Related Asset (Optional)
          </label>
          <select
            className="input"
            value={formData.assetId}
            onChange={(e) => {
              const assetId = e.target.value;
              const selectedAsset = assets.find(a => a.id === assetId);
              setFormData({ 
                ...formData, 
                assetId,
                location: selectedAsset?.location || formData.location
              });
            }}
          >
            <option value="">No Asset - General Work</option>
            {assets.map((asset: any) => (
              <option key={asset.id} value={asset.id}>
                {asset.assetCode} - {asset.name} ({asset.location})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Select an asset if this work order is related to a specific asset. Leave empty for general work.
          </p>
        </div>

        <div>
          <label className="label">Title *</label>
          <input
            type="text"
            required
            className="input"
            placeholder={`Enter ${getWorkTypeLabel(workType).toLowerCase()} title`}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Description *</label>
          <textarea
            required
            rows={4}
            className="input"
            placeholder={`Describe the ${getWorkTypeLabel(workType).toLowerCase()} request...`}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Location * ({allLocations.length} available)</label>
            <select
              required
              className="input"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            >
              <option value="">Select Location</option>
              {allLocations.length === 0 && (
                <option value="" disabled>No locations loaded - check console</option>
              )}
              {allLocations.map((loc: any, index: number) => (
                <option key={`${loc.value || loc.id || index}`} value={loc.value || loc.id}>
                  {getLocationOptionLabel(loc)}
                </option>
              ))}
            </select>
            {dynamicLocations.length === 0 && (
              <p className="text-xs text-orange-500 mt-1">
                No dynamic locations loaded from Firebase
              </p>
            )}
          </div>

          <div>
            <label className="label">Department *</label>
            <select
              required
              className="input"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            >
              <option value="">Select Department</option>
              {workTypeConfig?.departments?.map((deptValue: string) => {
                const dept = allDepartments.find((d: any) => d.value === deptValue);
                return (
                  <option key={deptValue} value={deptValue}>
                    {dept?.label || deptValue}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Priority</label>
            <select
              className="input"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="label">Due Date</label>
            <input
              type="date"
              className="input"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
        </div>

        {/* Image Upload */}
        <ImageUpload
          images={images}
          onImagesChange={setImages}
          maxImages={5}
          folder="work_orders"
          label="Upload Images (Optional)"
        />

        <div className="flex gap-4 pt-4">
          <Link to="/work-orders" className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold text-center hover:bg-gray-300 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-3 rounded-xl font-semibold text-white shadow-lg ${
              workTypeConfig?.color || 'bg-gray-500'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Plus className="h-5 w-5" />
              {loading ? 'Creating...' : `Create ${getWorkTypeLabel(workType)}`}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
