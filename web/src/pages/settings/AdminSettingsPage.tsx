import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Settings, MapPin, Building2, Plus, Trash2, Save, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminSettingsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [newLocation, setNewLocation] = useState({ value: '', label: '', type: 'shop', shortName: '' });
  const [newDepartment, setNewDepartment] = useState({ value: '', label: '', icon: '' });
  const [loading, setLoading] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [editShortName, setEditShortName] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const locSnap = await getDocs(collection(db, 'settings', 'locations', 'items'));
    setLocations(locSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    const deptSnap = await getDocs(collection(db, 'settings', 'departments', 'items'));
    setDepartments(deptSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const addLocation = async () => {
    if (!newLocation.value || !newLocation.label) return;
    await addDoc(collection(db, 'settings', 'locations', 'items'), newLocation);
    setNewLocation({ value: '', label: '', type: 'shop', shortName: '' });
    loadSettings();
    toast.success('Location added');
  };

  const addDepartment = async () => {
    if (!newDepartment.value || !newDepartment.label) return;
    await addDoc(collection(db, 'settings', 'departments', 'items'), newDepartment);
    setNewDepartment({ value: '', label: '', icon: '' });
    loadSettings();
    toast.success('Department added');
  };

  const deleteLocation = async (id: string) => {
    await deleteDoc(doc(db, 'settings', 'locations', 'items', id));
    loadSettings();
    toast.success('Location deleted');
  };

  const updateLocation = async (id: string) => {
    if (!editShortName.trim()) return;
    await updateDoc(doc(db, 'settings', 'locations', 'items', id), {
      shortName: editShortName.trim()
    });
    setEditingLocation(null);
    setEditShortName('');
    loadSettings();
    toast.success('Short name updated');
  };

  const deleteDepartment = async (id: string) => {
    await deleteDoc(doc(db, 'settings', 'departments', 'items', id));
    loadSettings();
    toast.success('Department deleted');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Settings</h1>
          <p className="text-gray-500">Manage locations, departments, and work types</p>
        </div>
      </div>

      {/* Locations Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-bold">Locations</h2>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="Location code (e.g., SHOP01)"
            className="input"
            value={newLocation.value}
            onChange={(e) => setNewLocation({ ...newLocation, value: e.target.value })}
          />
          <input
            type="text"
            placeholder="Location name"
            className="input"
            value={newLocation.label}
            onChange={(e) => setNewLocation({ ...newLocation, label: e.target.value })}
          />
          <input
            type="text"
            placeholder="Short name (e.g., AM for barcode)"
            className="input"
            value={newLocation.shortName}
            onChange={(e) => setNewLocation({ ...newLocation, shortName: e.target.value })}
          />
          <select
            className="input"
            value={newLocation.type}
            onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value })}
          >
            <option value="shop">Shop</option>
            <option value="warehouse">Warehouse</option>
            <option value="godown">Godown</option>
            <option value="office">Office</option>
            <option value="accommodation">Accommodation</option>
            <option value="rented">Rented Property</option>
            <option value="galolhu">Galolhu</option>
            <option value="doores">Doores</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button
          onClick={addLocation}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Location
        </button>

        <div className="mt-6 space-y-2">
          {locations.map((loc) => (
            <div key={loc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{loc.label}</span>
                  <span className="text-sm text-gray-500">({loc.value})</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    loc.type === 'shop' ? 'bg-blue-100 text-blue-800' :
                    loc.type === 'warehouse' ? 'bg-green-100 text-green-800' :
                    loc.type === 'godown' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>{loc.type}</span>
                </div>
                
                {editingLocation === loc.id ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Add short name (e.g., AM)"
                      className="input text-sm py-1 px-2"
                      value={editShortName}
                      onChange={(e) => setEditShortName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && updateLocation(loc.id)}
                      autoFocus
                    />
                    <button
                      onClick={() => updateLocation(loc.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="Save"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setEditingLocation(null); setEditShortName(''); }}
                      className="text-xs text-gray-500 px-2"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    {loc.shortName ? (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                        Short: {loc.shortName}
                      </span>
                    ) : (
                      <span className="text-xs text-orange-500">No short name (needed for barcode)</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {editingLocation !== loc.id && (
                  <button
                    onClick={() => { setEditingLocation(loc.id); setEditShortName(loc.shortName || ''); }}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                    title="Edit short name"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteLocation(loc.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Departments Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="h-6 w-6 text-purple-500" />
          <h2 className="text-xl font-bold">Departments</h2>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="Department code (e.g., marketing)"
            className="input"
            value={newDepartment.value}
            onChange={(e) => setNewDepartment({ ...newDepartment, value: e.target.value })}
          />
          <input
            type="text"
            placeholder="Department name"
            className="input"
            value={newDepartment.label}
            onChange={(e) => setNewDepartment({ ...newDepartment, label: e.target.value })}
          />
          <input
            type="text"
            placeholder="Icon name (e.g., Palette)"
            className="input"
            value={newDepartment.icon}
            onChange={(e) => setNewDepartment({ ...newDepartment, icon: e.target.value })}
          />
        </div>
        <button
          onClick={addDepartment}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Department
        </button>

        <div className="mt-6 space-y-2">
          {departments.map((dept) => (
            <div key={dept.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <span className="font-semibold">{dept.label}</span>
                <span className="text-sm text-gray-500 ml-2">({dept.value})</span>
                {dept.icon && <span className="text-xs text-gray-400 ml-2">Icon: {dept.icon}</span>}
              </div>
              <button
                onClick={() => deleteDepartment(dept.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
