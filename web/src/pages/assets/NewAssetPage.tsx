import { useState, useEffect, useRef } from 'react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { uploadMultipleImages } from '@/lib/cloudinary';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { ALL_LOCATIONS } from '@/lib/locations';
import { DEPARTMENTS } from '@/lib/departments';
import { generateAssetCode } from '@/lib/assetCode';
import toast from 'react-hot-toast';
import { ArrowLeft, Building2, MapPin, Tag, FileText, Printer, QrCode } from 'lucide-react';
import JsBarcode from 'jsbarcode';

export function NewAssetPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const barcodeRef = useRef<SVGSVGElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'equipment',
    location: '',
    department: '',
    assetCode: '',
    barcode: '',
    status: 'operational',
    priority: 'medium',
    description: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
    lastMaintenance: '',
    nextMaintenance: '',
    images: [] as string[],
  });

  // Auto-generate asset code when department changes
  useEffect(() => {
    if (formData.department && !formData.assetCode) {
      generateNewAssetCode();
    }
  }, [formData.department]);

  // Generate barcode when asset code changes
  useEffect(() => {
    if (formData.assetCode && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, formData.assetCode, {
          format: 'CODE128',
          width: 2,
          height: 100,
          displayValue: true,
          fontSize: 14,
          margin: 10,
        });
        setShowBarcode(true);
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [formData.assetCode]);

  const generateNewAssetCode = async () => {
    if (!formData.department) {
      toast.error('Please select a department first');
      return;
    }

    setGeneratingCode(true);
    try {
      const code = await generateAssetCode(formData.department);
      setFormData((prev) => ({ ...prev, assetCode: code, barcode: code }));
      toast.success(`Asset code generated: ${code}`);
    } catch (error) {
      toast.error('Failed to generate asset code');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handlePrintBarcode = () => {
    if (!barcodeRef.current) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const svg = barcodeRef.current.outerHTML;
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Asset Barcode - ${formData.assetCode}</title>
            <style>
              body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: Arial, sans-serif; }
              .barcode-container { text-align: center; padding: 20px; border: 1px dashed #ccc; }
              .asset-info { margin-top: 10px; font-size: 12px; color: #666; }
              .asset-name { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
              @media print { body { margin: 0; } .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              ${svg}
              <div class="asset-info">
                <div class="asset-name">${formData.name || 'Asset Name'}</div>
                <div>Code: ${formData.assetCode}</div>
                <div>Dept: ${formData.department?.toUpperCase() || 'N/A'}</div>
                ${formData.purchaseDate ? `<div>Purchased: ${new Date(formData.purchaseDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</div>` : ''}
              </div>
              <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">Print Barcode</button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetCode) {
      toast.error('Please generate an asset code first');
      return;
    }
    setLoading(true);
    try {
      let barcodeDataUrl = '';
      if (barcodeRef.current) {
        const svgData = new XMLSerializer().serializeToString(barcodeRef.current);
        barcodeDataUrl = 'data:image/svg+xml;base64,' + btoa(svgData);
      }
      await addDoc(collection(db, 'assets'), {
        ...formData,
        barcodeSvg: barcodeDataUrl,
        createdAt: new Date().toISOString(),
        createdBy: user?.id,
        updatedAt: new Date().toISOString(),
      });
      toast.success(`Asset ${formData.assetCode} created successfully!`);
      navigate('/assets');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/assets" className="btn btn-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Asset</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Asset Name */}
                <div className="md:col-span-2">
                  <label className="label">Asset Name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      className="input pl-10"
                      placeholder="Enter asset name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                {/* Department - Required for code generation */}
                <div>
                  <label className="label">Department *</label>
                  <select
                    required
                    className="input"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value, assetCode: '' })}
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept.value} value={dept.value}>{dept.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Required for auto-generating asset code</p>
                </div>

                {/* Asset Code */}
                <div>
                  <label className="label">Asset Code *</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        readOnly
                        className="input pl-10 bg-gray-50"
                        placeholder="MADIT0012"
                        value={formData.assetCode}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={generateNewAssetCode}
                      disabled={!formData.department || generatingCode}
                      className="btn btn-secondary whitespace-nowrap"
                    >
                      {generatingCode ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Format: MAD + Dept Code + Sequential Number</p>
                </div>

            <div>
              <label className="label">Asset Type *</label>
              <select
                required
                className="input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="equipment">Equipment</option>
                <option value="machinery">Machinery</option>
                <option value="vehicle">Vehicle</option>
                <option value="building">Building</option>
                <option value="it">IT Equipment</option>
                <option value="furniture">Furniture</option>
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
              <label className="label">Status *</label>
              <select
                required
                className="input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="operational">Operational</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="repair">Needs Repair</option>
                <option value="offline">Offline</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            <div>
              <label className="label">Priority *</label>
              <select
                required
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
              <label className="label">Manufacturer</label>
              <input
                type="text"
                className="input"
                placeholder="Enter manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Model</label>
              <input
                type="text"
                className="input"
                placeholder="Enter model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Serial Number</label>
              <input
                type="text"
                className="input"
                placeholder="Enter serial number"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Purchase Date</label>
              <input
                type="date"
                className="input"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Warranty Expiry</label>
              <input
                type="date"
                className="input"
                value={formData.warrantyExpiry}
                onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Last Maintenance</label>
              <input
                type="date"
                className="input"
                value={formData.lastMaintenance}
                onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Next Maintenance</label>
              <input
                type="date"
                className="input"
                value={formData.nextMaintenance}
                onChange={(e) => setFormData({ ...formData, nextMaintenance: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Asset Images</label>
              <ImageUpload
                images={formData.images}
                onChange={(images) => setFormData({ ...formData, images })}
                maxImages={5}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Description</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  rows={3}
                  className="input pl-10"
                  placeholder="Enter asset description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Link to="/assets" className="btn btn-secondary flex-1">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.assetCode}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>

    {/* Barcode Preview Panel */}
    <div className="lg:col-span-1">
      <div className="card sticky top-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Barcode Preview
        </h2>
        
        {formData.assetCode ? (
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 mb-4">
              <svg ref={barcodeRef} className="w-full"></svg>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handlePrintBarcode}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Printer className="h-5 w-5" />
                Print Barcode
              </button>
              
              <button
                onClick={() => setShowBarcode(!showBarcode)}
                className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                {showBarcode ? 'Hide Barcode' : 'Show Barcode'}
              </button>
              
              <div className="text-xs text-gray-500 mt-4 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">Asset Code:</p>
                <p className="text-lg font-bold text-gray-900">{formData.assetCode}</p>
                
                {formData.department && (
                  <>
                    <p className="font-medium mt-2">Department:</p>
                    <p>{DEPARTMENTS.find(d => d.value === formData.department)?.label}</p>
                  </>
                )}
                
                <p className="font-medium mt-2">Format:</p>
                <p className="text-gray-600">MAD + Dept Code + 4-digit Number</p>
                <p className="mt-1 text-gray-400">Example: MADIT0012</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <QrCode className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="font-medium mb-2">No Asset Code Generated</p>
            <p className="text-sm">Select a department in the form to generate an asset code and barcode</p>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <p>👆 Go to the Department field in the form</p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
  );
}
