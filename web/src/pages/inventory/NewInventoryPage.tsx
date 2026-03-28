import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { ALL_LOCATIONS } from '@/lib/locations';
import toast from 'react-hot-toast';
import { ArrowLeft, Package, Tag, DollarSign, Building2, Hash, AlertCircle } from 'lucide-react';

export function NewInventoryPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    partNumber: '',
    category: 'mechanical',
    location: '',
    quantity: '0',
    minStock: '0',
    unit: 'pcs',
    cost: '',
    supplier: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'inventory'), {
        ...formData,
        quantity: parseInt(formData.quantity),
        minStock: parseInt(formData.minStock),
        cost: parseFloat(formData.cost) || 0,
        createdBy: user?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast.success('Inventory item added successfully!');
      navigate('/inventory');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add inventory item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/inventory" className="btn btn-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Inventory Item</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="label">Item Name *</label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="input pl-10"
                  placeholder="Enter item name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Part Number</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Enter part number"
                  value={formData.partNumber}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Category *</label>
              <select
                required
                className="input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="mechanical">Mechanical</option>
                <option value="electrical">Electrical</option>
                <option value="hydraulic">Hydraulic</option>
                <option value="pneumatic">Pneumatic</option>
                <option value="electronics">Electronics</option>
                <option value="fasteners">Fasteners</option>
                <option value="consumables">Consumables</option>
                <option value="tools">Tools</option>
                <option value="safety">Safety Equipment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Location *</label>
              <select
                required
                className="input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              >
                <option value="">Select Location</option>
                <optgroup label="UFANVELI Shops">
                  {ALL_LOCATIONS.filter(l => l.value.startsWith('UF') || l.value === 'UBS').map(loc => (
                    <option key={loc.value} value={loc.value}>{loc.label}</option>
                  ))}
                </optgroup>
                <optgroup label="HULHUMALE GODOWN (HMCGD)">
                  {ALL_LOCATIONS.filter(l => l.value.startsWith('HMCGD')).map(loc => (
                    <option key={loc.value} value={loc.value}>{loc.label}</option>
                  ))}
                </optgroup>
                <optgroup label="MALE CENTRAL GODOWN (MCG)">
                  {ALL_LOCATIONS.filter(l => l.value.startsWith('MCG')).map(loc => (
                    <option key={loc.value} value={loc.value}>{loc.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="label">Quantity *</label>
              <input
                type="number"
                required
                min="0"
                className="input"
                placeholder="Enter quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Unit *</label>
              <select
                required
                className="input"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="liters">Liters</option>
                <option value="meters">Meters</option>
                <option value="boxes">Boxes</option>
                <option value="rolls">Rolls</option>
                <option value="sets">Sets</option>
                <option value="pairs">Pairs</option>
              </select>
            </div>

            <div>
              <label className="label">Minimum Stock Level *</label>
              <input
                type="number"
                required
                min="0"
                className="input"
                placeholder="Enter minimum stock"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Unit Cost</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input pl-10"
                  placeholder="Enter unit cost"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Supplier</label>
              <input
                type="text"
                className="input"
                placeholder="Enter supplier name"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea
                rows={3}
                className="input"
                placeholder="Enter item description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Link to="/inventory" className="btn btn-secondary flex-1">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
