import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { doc, getDoc, updateDoc, serverTimestamp, DocumentData, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  ArrowLeft, Clock, User, Package, CheckCircle, XCircle,
  ShoppingCart, Plus, Image as ImageIcon, Trash2, AlertTriangle,
  AlertCircle, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getStageDetails, calculateDuration } from '@/lib/workflow';
import { ImageUpload, ImageGallery } from '@/components/ui/ImageUpload';
import { useAuthStore } from '@/stores/authStore';
import { notifyWorkOrderAssigned, notifyPurchaseRequest } from '@/lib/notificationHelpers';
import toast from 'react-hot-toast';

// Fetch all users for assignment
async function fetchStaffUsers() {
  const usersRef = collection(db, 'users');
  // Fetch ALL users - any role can be assigned work orders
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    raised: 'bg-gray-100 text-gray-800',
    assigned_to_supervisor: 'bg-blue-100 text-blue-800',
    assigned_to_technician: 'bg-indigo-100 text-indigo-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    need_to_buy: 'bg-orange-100 text-orange-800',
    purchase_assigned_technician: 'bg-orange-100 text-orange-800',
    purchase_assigned_purchasing: 'bg-orange-100 text-orange-800',
    quotation_in_progress: 'bg-purple-100 text-purple-800',
    quotation_submitted_for_signature: 'bg-purple-100 text-purple-800',
    quotation_approved: 'bg-teal-100 text-teal-800',
    quotation_rejected: 'bg-red-100 text-red-800',
    payment_done: 'bg-emerald-100 text-emerald-800',
    items_collection_assigned: 'bg-green-100 text-green-800',
    items_purchased: 'bg-teal-100 text-teal-800',
    items_received: 'bg-yellow-100 text-yellow-800',
    work_started_with_items: 'bg-yellow-100 text-yellow-800',
    fixed: 'bg-lime-100 text-lime-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    need_to_buy_again: 'bg-orange-100 text-orange-800',
  };
  const stageInfo = getStageDetails(status);
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${colors[status] || 'bg-gray-100'}`}>
      {stageInfo?.label || status.replace(/_/g, ' ')}
    </span>
  );
}

export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseItems, setPurchaseItems] = useState([{ name: '', quantity: 1, estimatedCost: 0 }]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [assignRole, setAssignRole] = useState<string>('any');
  const [assignComment, setAssignComment] = useState('');
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusComment, setStatusComment] = useState('');
  const [pendingStatus, setPendingStatus] = useState('');
  const [workProgress, setWorkProgress] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showCompletionImages, setShowCompletionImages] = useState(false);
  const [completionImages, setCompletionImages] = useState<string[]>([]);

  useEffect(() => {
    fetchStaffUsers().then(setStaffUsers).catch(console.error);
  }, []);

  const { data: workOrder, refetch } = useQuery(['workOrder', id], async () => {
    if (!id) return null;
    const docRef = doc(db, 'work_orders', id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } as any : null;
  });

  const updateStatus = async (newStatus: string, additionalData?: any) => {
    if (!id) return;
    setUpdating(true);
    
    const updateData: any = {
      status: newStatus,
      updatedAt: serverTimestamp(),
      workflowHistory: [...(workOrder?.workflowHistory || []), {
        stage: newStatus,
        timestamp: new Date().toISOString(),
        userId: currentUser?.id,
        userName: currentUser?.name || currentUser?.email || 'Unknown',
        ...additionalData
      }]
    };

    if (!workOrder?.stageTimestamps) {
      updateData.stageTimestamps = {};
    }
    updateData[`stageTimestamps.${newStatus}`] = new Date().toISOString();

    const prevStage = workOrder?.status;
    if (prevStage && workOrder?.stageTimestamps?.[prevStage]) {
      const startDate = new Date(workOrder.stageTimestamps[prevStage]);
      const endDate = new Date();
      const duration = calculateDuration(startDate, endDate);
      updateData[`stageDurations.${prevStage}`] = duration;
    }

    await updateDoc(doc(db, 'work_orders', id), updateData);
    await refetch();
    setUpdating(false);
    toast.success(`Status updated to: ${newStatus.replace(/_/g, ' ')}`);
  };

  const handleAssignStaff = async () => {
    if (!selectedStaff) { toast.error('Please select a staff member'); return; }
    if (!assignComment.trim()) { toast.error('Please add a comment for this assignment'); return; }
    const staff = staffUsers.find(s => s.id === selectedStaff);
    const staffRole = staff?.role || 'user';
    const newStatus = `assigned_to_${staffRole}`;
    
    await updateStatus(newStatus, {
      assignedToId: selectedStaff,
      assignedToName: staff?.name || staff?.email,
      assignedToRole: staffRole,
      assignedAt: new Date().toISOString(),
      assignComment: assignComment,
      // Keep backwards compatibility
      [`${staffRole}Id`]: selectedStaff,
      [`${staffRole}Name`]: staff?.name || staff?.email,
      [`${staffRole}AssignedAt`]: new Date().toISOString(),
      [`${staffRole}Comment`]: assignComment,
    });
    
    // Create notification for assigned user
    await notifyWorkOrderAssigned(
      id!,
      workOrder?.woNumber || '',
      workOrder?.title || '',
      staff?.name || staff?.email || 'Unknown',
      currentUser?.name || 'Someone',
      selectedStaff,
      staffRole
    );
    
    setShowAssignModal(false);
    setSelectedStaff('');
    setAssignComment('');
    toast.success(`Assigned to ${staff?.name || staff?.email}`);
  };

  const handlePurchaseRequest = async () => {
    const totalCost = purchaseItems.reduce((sum, item) => sum + (item.estimatedCost * item.quantity), 0);
    await updateStatus('need_to_buy', { purchaseItems, purchaseCost: totalCost, needsPurchase: true });
    
    // Notify supervisor and admin
    await notifyPurchaseRequest(id!, workOrder?.woNumber || '', workOrder?.title || '', currentUser?.name || 'Technician');
    
    setShowPurchaseForm(false);
    setPurchaseItems([{ name: '', quantity: 1, estimatedCost: 0 }]);
    toast.success('Purchase request submitted. Supervisor and Admin notified.');
  };

  const handleAddCompletionImages = async () => {
    if (!id) return;
    await updateDoc(doc(db, 'work_orders', id), {
      completionImages: [...(workOrder?.completionImages || []), ...completionImages],
      updatedAt: serverTimestamp(),
    });
    await refetch();
    setShowCompletionImages(false);
    setCompletionImages([]);
    toast.success('Completion images added');
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete work orders');
      return;
    }
    try {
      await deleteDoc(doc(db, 'work_orders', id));
      toast.success('Work order deleted successfully');
      navigate('/work-orders');
    } catch (error) {
      toast.error('Failed to delete work order');
    }
  };

  const addPurchaseItem = () => setPurchaseItems([...purchaseItems, { name: '', quantity: 1, estimatedCost: 0 }]);
  const updatePurchaseItem = (index: number, field: string, value: any) => {
    const updated = [...purchaseItems];
    updated[index] = { ...updated[index], [field]: value };
    setPurchaseItems(updated);
  };
  const removePurchaseItem = (index: number) => setPurchaseItems(purchaseItems.filter((_, i) => i !== index));

  if (!workOrder) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/work-orders" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workOrder.woNumber}</h1>
            <p className="text-sm text-gray-500">{workOrder.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && (
            <>
              {(workOrder.status === 'open' || workOrder.status === 'assigned_to_technician') && (
                <button
                  onClick={() => {
                    setPendingStatus('in_progress');
                    setShowStatusModal(true);
                  }}
                  disabled={updating}
                  className="btn-primary inline-flex items-center"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Start Work
                </button>
              )}
              {workOrder.status === 'in_progress' && (
                <button
                  onClick={() => {
                    setPendingStatus('completed');
                    setShowStatusModal(true);
                  }}
                  disabled={updating}
                  className="btn-success inline-flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </button>
              )}
              <button
                onClick={() => {
                  setPendingStatus('cancelled');
                  setShowStatusModal(true);
                }}
                disabled={updating}
                className="btn-danger inline-flex items-center"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </>
          )}
          {isSuperAdmin && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-danger inline-flex items-center bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Work Order Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={workOrder.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <span className={`badge priority-${workOrder.priority}`}>{workOrder.priority}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium capitalize">{workOrder.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-medium">
                  {workOrder.dueDate ? format(workOrder.dueDate.toDate(), 'MMM d, yyyy') : 'Not set'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Description</p>
              <p className="mt-1">{workOrder.description}</p>
            </div>

            {/* Workflow Path Selection - Only shown when technician starts work */}
            {workOrder.status === 'in_progress' && (
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-3">Does this work require purchasing parts/materials?</p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!id) return;
                      await updateDoc(doc(db, 'work_orders', id), {
                        needsPurchase: false,
                        updatedAt: serverTimestamp(),
                      });
                      refetch();
                      toast.success('Marked as: No purchase needed - can complete directly');
                    }}
                    disabled={updating}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      workOrder.needsPurchase === false
                        ? 'bg-green-100 text-green-700 border-2 border-green-500'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    No - Complete Directly
                  </button>
                  <button
                    onClick={async () => {
                      if (!id) return;
                      await updateDoc(doc(db, 'work_orders', id), {
                        needsPurchase: true,
                        updatedAt: serverTimestamp(),
                      });
                      refetch();
                      toast.success('Marked as: Need parts - will start purchase workflow');
                    }}
                    disabled={updating}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      workOrder.needsPurchase === true
                        ? 'bg-orange-100 text-orange-700 border-2 border-orange-500'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4 inline mr-1" />
                    Yes - Need Parts
                  </button>
                </div>
                {workOrder.needsPurchase === false && (
                  <p className="text-xs text-green-600 mt-2">
                    You can complete this work directly without purchasing anything
                  </p>
                )}
                {workOrder.needsPurchase === true && (
                  <p className="text-xs text-orange-600 mt-2">
                    Purchase workflow: Quotation → Approval → Payment → Purchase → Complete
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Purchase Items Needed */}
          {workOrder.needsPurchase && workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && (
            <div className="card border-orange-200 bg-orange-50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-orange-900">
                  <ShoppingCart className="h-5 w-5" />
                  Purchase Required
                </h2>
                {workOrder.status !== 'quotation_requested' && workOrder.status !== 'quotation_received' && (
                  <button
                    onClick={() => setShowPurchaseForm(true)}
                    className="py-1 px-3 bg-orange-500 text-white rounded-lg text-sm"
                  >
                    Add Items
                  </button>
                )}
              </div>
              
              {workOrder.purchaseItems?.length > 0 ? (
                <table className="min-w-full divide-y divide-orange-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-orange-700 uppercase">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-orange-700 uppercase">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-orange-700 uppercase">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrder.purchaseItems.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-orange-900">{item.name}</td>
                        <td className="px-4 py-2 text-sm text-orange-900">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-orange-900">MVR {(item.estimatedCost * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-orange-700">No items added yet. Click "Add Items" to list required parts.</p>
              )}

              {/* Workflow Actions for Purchase Path */}
              <div className="mt-4 pt-4 border-t border-orange-200 flex flex-wrap gap-2">
                {/* Need to Buy - Admin/Supervisor decides how to proceed */}
                {workOrder.status === 'need_to_buy' && (
                  <>
                    <button
                      onClick={() => {
                        setPendingStatus('purchase_assigned_technician');
                        setShowStatusModal(true);
                      }}
                      disabled={updating}
                      className="py-2 px-4 bg-blue-500 text-white rounded-lg text-sm font-medium"
                    >
                      Buy by Tech & Submit Bill
                    </button>
                    <button
                      onClick={() => {
                        setPendingStatus('purchase_assigned_purchasing');
                        setShowStatusModal(true);
                      }}
                      disabled={updating}
                      className="py-2 px-4 bg-purple-500 text-white rounded-lg text-sm font-medium"
                    >
                      Assign to Purchasing
                    </button>
                  </>
                )}

                {/* Purchasing Team Acknowledges */}
                {workOrder.status === 'purchase_assigned_purchasing' && (
                  <button
                    onClick={() => {
                      setPendingStatus('quotation_in_progress');
                      setShowStatusModal(true);
                    }}
                    disabled={updating}
                    className="py-2 px-4 bg-purple-500 text-white rounded-lg text-sm font-medium"
                  >
                    Acknowledge & Start Quotation
                  </button>
                )}

                {/* Quotation In Progress */}
                {workOrder.status === 'quotation_in_progress' && (
                  <button
                    onClick={() => {
                      setPendingStatus('quotation_submitted_for_signature');
                      setShowStatusModal(true);
                    }}
                    disabled={updating}
                    className="py-2 px-4 bg-pink-500 text-white rounded-lg text-sm font-medium"
                  >
                    Submit Quotation for Signature
                  </button>
                )}

                {/* Submitted for Signature - Admin/Supervisor Approves */}
                {workOrder.status === 'quotation_submitted_for_signature' && (
                  <>
                    <button
                      onClick={() => {
                        setPendingStatus('quotation_approved');
                        setShowStatusModal(true);
                      }}
                      disabled={updating}
                      className="py-2 px-4 bg-green-500 text-white rounded-lg text-sm font-medium"
                    >
                      Approve & Sign
                    </button>
                    <button
                      onClick={() => {
                        setPendingStatus('quotation_rejected');
                        setShowStatusModal(true);
                      }}
                      disabled={updating}
                      className="py-2 px-4 bg-red-500 text-white rounded-lg text-sm font-medium"
                    >
                      Reject & Return
                    </button>
                  </>
                )}

                {/* Quotation Rejected - Back to Purchasing */}
                {workOrder.status === 'quotation_rejected' && (
                  <button
                    onClick={() => {
                      setPendingStatus('quotation_in_progress');
                      setShowStatusModal(true);
                    }}
                    disabled={updating}
                    className="py-2 px-4 bg-purple-500 text-white rounded-lg text-sm font-medium"
                  >
                    Get New Quotation
                  </button>
                )}

                {/* Quotation Approved - Mark as Paid */}
                {workOrder.status === 'quotation_approved' && (
                  <button
                    onClick={() => {
                      setPendingStatus('payment_done');
                      setShowStatusModal(true);
                    }}
                    disabled={updating}
                    className="py-2 px-4 bg-emerald-500 text-white rounded-lg text-sm font-medium"
                  >
                    Mark as Paid
                  </button>
                )}

                {/* Payment Done - Assign to Collect */}
                {workOrder.status === 'payment_done' && (
                  <button
                    onClick={() => {
                      setPendingStatus('items_collection_assigned');
                      setShowStatusModal(true);
                    }}
                    disabled={updating}
                    className="py-2 px-4 bg-green-500 text-white rounded-lg text-sm font-medium"
                  >
                    Assign to Collect Items
                  </button>
                )}

                {/* Collection Assigned - Mark Items Collected */}
                {workOrder.status === 'items_collection_assigned' && (
                  <button
                    onClick={() => {
                      setPendingStatus('items_purchased');
                      setShowStatusModal(true);
                    }}
                    disabled={updating}
                    className="py-2 px-4 bg-teal-500 text-white rounded-lg text-sm font-medium"
                  >
                    Mark Items Collected
                  </button>
                )}

                {/* Items Purchased - Technician Receives */}
                {workOrder.status === 'items_purchased' && (
                  <button
                    onClick={() => {
                      setPendingStatus('items_received');
                      setShowStatusModal(true);
                    }}
                    disabled={updating}
                    className="py-2 px-4 bg-yellow-500 text-white rounded-lg text-sm font-medium"
                  >
                    Receive Items
                  </button>
                )}

                {/* Items Received - Start Work */}
                {workOrder.status === 'items_received' && (
                  <button
                    onClick={() => {
                      setPendingStatus('work_started_with_items');
                      setShowStatusModal(true);
                    }}
                    disabled={updating}
                    className="py-2 px-4 bg-yellow-600 text-white rounded-lg text-sm font-medium"
                  >
                    Start Work with Items
                  </button>
                )}

                {/* Work Started with Items - Fixed or Need More Parts */}
                {workOrder.status === 'work_started_with_items' && (
                  <>
                    <button
                      onClick={() => {
                        setPendingStatus('fixed');
                        setShowStatusModal(true);
                      }}
                      disabled={updating}
                      className="py-2 px-4 bg-lime-500 text-white rounded-lg text-sm font-medium"
                    >
                      Mark as Fixed
                    </button>
                    <button
                      onClick={() => {
                        setPendingStatus('need_to_buy_again');
                        setShowStatusModal(true);
                      }}
                      disabled={updating}
                      className="py-2 px-4 bg-orange-500 text-white rounded-lg text-sm font-medium"
                    >
                      Need More Parts
                    </button>
                  </>
                )}

                {/* Need to Buy Again - Restart Purchase Flow */}
                {workOrder.status === 'need_to_buy_again' && (
                  <>
                    <button
                      onClick={() => {
                        setPendingStatus('purchase_assigned_technician');
                        setShowStatusModal(true);
                      }}
                      disabled={updating}
                      className="py-2 px-4 bg-blue-500 text-white rounded-lg text-sm font-medium"
                    >
                      Buy by Tech & Submit Bill
                    </button>
                    <button
                      onClick={() => {
                        setPendingStatus('purchase_assigned_purchasing');
                        setShowStatusModal(true);
                      }}
                      disabled={updating}
                      className="py-2 px-4 bg-purple-500 text-white rounded-lg text-sm font-medium"
                    >
                      Assign to Purchasing
                    </button>
                  </>
                )}

                {/* Fixed - Complete */}
                {workOrder.status === 'fixed' && (
                  <button
                    onClick={() => {
                      setPendingStatus('completed');
                      setShowStatusModal(true);
                    }}
                    disabled={updating}
                    className="py-2 px-4 bg-green-600 text-white rounded-lg text-sm font-medium"
                  >
                    Complete Work Order
                  </button>
                )}
              </div>

              {/* Current Status Info */}
              {workOrder.status && workOrder.status !== 'assigned_to_supervisor' && workOrder.status !== 'assigned_to_technician' && (
                <div className="mt-3 p-2 bg-white rounded border border-orange-200">
                  <p className="text-xs text-orange-800 font-medium">
                    Current: {workOrder.status.replace(/_/g, ' ').toUpperCase()}
                  </p>
                  {workOrder.workflowHistory?.filter((h: any) => h.stage === workOrder.status).slice(-1)[0]?.comment && (
                    <p className="text-xs text-gray-600 mt-1 italic">
                      "{workOrder.workflowHistory.filter((h: any) => h.stage === workOrder.status).slice(-1)[0].comment}"
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Parts Used (Completed) */}
          {!workOrder.needsPurchase && workOrder.partsUsed?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Parts Used
              </h2>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Part</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrder.partsUsed.map((part: DocumentData, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm">{part.name}</td>
                      <td className="px-4 py-2 text-sm">{part.quantity}</td>
                      <td className="px-4 py-2 text-sm">${part.totalCost?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Request Images */}
          {workOrder.images?.length > 0 && (
            <div className="card">
              <ImageGallery images={workOrder.images} title="Request Images" />
            </div>
          )}

          {/* Completion Images */}
          {workOrder.completionImages?.length > 0 && (
            <div className="card">
              <ImageGallery images={workOrder.completionImages} title="Completion Images" />
            </div>
          )}

          {/* Add Completion Images Button */}
          {workOrder.status === 'completed' && (
            <div className="card">
              <button
                onClick={() => setShowCompletionImages(true)}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <ImageIcon className="h-5 w-5" />
                Add Completion Photos
              </button>
            </div>
          )}

          {/* Activity History / Timeline */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activity History
            </h2>
            <div className="space-y-4">
              {workOrder.workflowHistory?.length > 0 ? (
                workOrder.workflowHistory.map((event: any, index: number) => (
                  <div key={index} className="flex gap-3">
                    <div className={`p-2 rounded-lg h-fit ${
                      event.stage === 'raised' ? 'bg-purple-100 text-purple-600' :
                      event.stage?.includes('assigned') ? 'bg-blue-100 text-blue-600' :
                      event.stage === 'in_progress' ? 'bg-yellow-100 text-yellow-600' :
                      event.stage === 'completed' ? 'bg-green-100 text-green-600' :
                      event.stage === 'progress_update' ? 'bg-indigo-100 text-indigo-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {event.stage === 'raised' ? <CheckCircle className="h-4 w-4" /> :
                       event.stage?.includes('assigned') ? <User className="h-4 w-4" /> :
                       event.stage === 'in_progress' ? <Clock className="h-4 w-4" /> :
                       event.stage === 'completed' ? <CheckCircle className="h-4 w-4" /> :
                       event.stage === 'progress_update' ? <TrendingUp className="h-4 w-4" /> :
                       <AlertCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {event.stage === 'progress_update' 
                          ? `Progress updated to ${event.progress}%`
                          : event.stage?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                        }
                        {event.userName && (
                          <span className="text-gray-500 font-normal"> by <strong>{event.userName}</strong></span>
                        )}
                      </p>
                      {event.comment && (
                        <p className="text-sm text-gray-600 mt-1 italic">
                          "{event.comment}"
                        </p>
                      )}
                      {event.stage?.includes('assigned_to_supervisor') && event.supervisorName && (
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned to: <strong>{event.supervisorName}</strong>
                        </p>
                      )}
                      {event.stage?.includes('assigned_to_technician') && event.technicianName && (
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned to: <strong>{event.technicianName}</strong>
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No activity recorded yet
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Assignment
            </h2>
            
            {/* Generic Assigned User Display */}
            {workOrder.assignedToName && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500">Assigned To</p>
                <p className="font-medium text-blue-900">{workOrder.assignedToName}</p>
                <p className="text-xs text-blue-600 capitalize">({workOrder.assignedToRole || 'User'})</p>
                {workOrder.assignedAt && (
                  <p className="text-xs text-blue-600">
                    Assigned: {format(new Date(workOrder.assignedAt), 'MMM d, yyyy HH:mm')}
                  </p>
                )}
                {workOrder.assignComment && (
                  <p className="text-sm text-gray-600 mt-1 italic">
                    "{workOrder.assignComment}"
                  </p>
                )}
              </div>
            )}
            
            {/* Backwards compatibility - Supervisor Assignment */}
            {workOrder.supervisorName && !workOrder.assignedToName && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500">Supervisor</p>
                <p className="font-medium text-blue-900">{workOrder.supervisorName}</p>
                {workOrder.supervisorAssignedAt && (
                  <p className="text-xs text-blue-600">
                    Assigned: {format(new Date(workOrder.supervisorAssignedAt), 'MMM d, yyyy HH:mm')}
                  </p>
                )}
                {workOrder.supervisorComment && (
                  <p className="text-sm text-gray-600 mt-1 italic">
                    "{workOrder.supervisorComment}"
                  </p>
                )}
              </div>
            )}
            
            {/* Backwards compatibility - Technician Assignment */}
            {workOrder.technicianName && !workOrder.assignedToName && (
              <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                <p className="text-sm text-gray-500">Technician</p>
                <p className="font-medium text-indigo-900">{workOrder.technicianName}</p>
                {workOrder.technicianAssignedAt && (
                  <p className="text-xs text-indigo-600">
                    Assigned: {format(new Date(workOrder.technicianAssignedAt), 'MMM d, yyyy HH:mm')}
                  </p>
                )}
                {workOrder.technicianComment && (
                  <p className="text-sm text-gray-600 mt-1 italic">
                    "{workOrder.technicianComment}"
                  </p>
                )}
              </div>
            )}
            
            {!workOrder.assignedToName && !workOrder.supervisorName && !workOrder.technicianName && (
              <p className="text-sm text-gray-500 mb-4">Unassigned</p>
            )}

            <div className="mt-4 grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  setAssignRole('any');
                  setShowAssignModal(true);
                }}
                disabled={updating}
                className="w-full py-2 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                Assign to User
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Work Progress</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Completion</span>
                  <span className="font-medium">{workOrder.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${workOrder.progress || 0}%` }}
                  />
                </div>
              </div>
              {workOrder.progressComment && (
                <p className="text-sm text-gray-600 italic">
                  "{workOrder.progressComment}"
                </p>
              )}
              {workOrder.progressUpdatedAt && (
                <p className="text-xs text-gray-400">
                  Updated: {format(new Date(workOrder.progressUpdatedAt), 'MMM d, HH:mm')}
                </p>
              )}
              <button
                onClick={() => {
                  setWorkProgress(workOrder.progress || 0);
                  setShowProgressModal(true);
                }}
                disabled={updating}
                className="w-full py-2 bg-green-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                Update Progress
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Timeline</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span>{workOrder.createdAt ? format(workOrder.createdAt.toDate(), 'MMM d, HH:mm') : 'N/A'}</span>
              </div>
              {workOrder.startedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Started</span>
                  <span>{format(workOrder.startedAt.toDate(), 'MMM d, HH:mm')}</span>
                </div>
              )}
              {workOrder.completedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed</span>
                  <span>{format(workOrder.completedAt.toDate(), 'MMM d, HH:mm')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Cost Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Labor</span>
                <span>${workOrder.laborCost?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Parts</span>
                <span>${workOrder.partsCost?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-semibold">
                <span>Total</span>
                <span>${workOrder.cost?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Staff Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Assign Work Order</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Staff</label>
                <select
                  className="input w-full"
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                >
                  <option value="">Choose...</option>
                  {staffUsers.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email} ({user.role})
                    </option>
                  ))}
                </select>
                {staffUsers.length === 0 && (
                  <p className="text-sm text-orange-600 mt-2">No staff found. Add users first.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comment (Required)</label>
                <textarea
                  className="input w-full"
                  rows={3}
                  placeholder="Add a comment about this assignment..."
                  value={assignComment}
                  onChange={(e) => setAssignComment(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-2 bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignStaff}
                  disabled={!selectedStaff || !assignComment.trim()}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion Images Modal */}
      {showCompletionImages && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Add Completion Photos
            </h2>
            <ImageUpload
              images={completionImages}
              onImagesChange={setCompletionImages}
              maxImages={5}
              folder="work_orders/completion"
              label="Upload completion photos (optional)"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCompletionImages(false)}
                className="flex-1 py-3 bg-gray-200 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCompletionImages}
                disabled={completionImages.length === 0}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium disabled:opacity-50"
              >
                Save Photos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Request Form */}
      {showPurchaseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Purchase Request
            </h2>
            <div className="space-y-4">
              {purchaseItems.map((item, index) => (
                <div key={index} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg">
                  <div className="flex-1">
                    <label className="text-xs font-medium">Item Name</label>
                    <input
                      type="text"
                      className="input w-full"
                      value={item.name}
                      onChange={(e) => updatePurchaseItem(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-xs font-medium">Qty</label>
                    <input
                      type="number"
                      min="1"
                      className="input w-full"
                      value={item.quantity}
                      onChange={(e) => updatePurchaseItem(index, 'quantity', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="w-32">
                    <label className="text-xs font-medium">Cost (MVR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input w-full"
                      value={item.estimatedCost}
                      onChange={(e) => updatePurchaseItem(index, 'estimatedCost', parseFloat(e.target.value))}
                    />
                  </div>
                  <button
                    onClick={() => removePurchaseItem(index)}
                    className="mt-5 p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <button
                onClick={addPurchaseItem}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Add Item
              </button>
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-xl font-bold">
                    MVR {purchaseItems.reduce((sum, item) => sum + (item.estimatedCost * item.quantity), 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPurchaseForm(false)}
                    className="px-4 py-2 bg-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePurchaseRequest}
                    disabled={updating || purchaseItems.some(i => !i.name)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg disabled:opacity-50"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Comment Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Update Status</h2>
            <p className="text-sm text-gray-600 mb-4">
              Changing status to: <span className="font-semibold capitalize">{pendingStatus.replace(/_/g, ' ')}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment (Required)
                </label>
                <textarea
                  className="input w-full"
                  rows={4}
                  placeholder="Add a comment about this status update..."
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusComment('');
                    setPendingStatus('');
                  }}
                  className="flex-1 py-2 bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!statusComment.trim()) {
                      toast.error('Please add a comment');
                      return;
                    }
                    updateStatus(pendingStatus, { comment: statusComment });
                    setShowStatusModal(false);
                    setStatusComment('');
                    setPendingStatus('');
                  }}
                  disabled={!statusComment.trim()}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Work Progress Update Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Update Work Progress</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress: {workProgress}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={workProgress}
                  onChange={(e) => setWorkProgress(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment (Required)
                </label>
                <textarea
                  className="input w-full"
                  rows={3}
                  placeholder="Add a comment about this progress update..."
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowProgressModal(false);
                    setStatusComment('');
                  }}
                  className="flex-1 py-2 bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!statusComment.trim()) {
                      toast.error('Please add a comment');
                      return;
                    }
                    if (!id) return;
                    setUpdating(true);
                    try {
                      await updateDoc(doc(db, 'work_orders', id), {
                        progress: workProgress,
                        progressComment: statusComment,
                        progressUpdatedAt: new Date().toISOString(),
                        updatedAt: serverTimestamp(),
                        workflowHistory: [...(workOrder?.workflowHistory || []), {
                          stage: 'progress_update',
                          progress: workProgress,
                          comment: statusComment,
                          timestamp: new Date().toISOString(),
                          user: 'current_user',
                        }]
                      });
                      await refetch();
                      toast.success(`Progress updated to ${workProgress}%`);
                      setShowProgressModal(false);
                      setStatusComment('');
                    } catch (error) {
                      toast.error('Failed to update progress');
                    } finally {
                      setUpdating(false);
                    }
                  }}
                  disabled={!statusComment.trim()}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
                >
                  Save Progress
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <h2 className="text-xl font-bold">Delete Work Order?</h2>
            </div>
            <p className="text-gray-600 mb-6">
              This will permanently delete work order <strong>{workOrder.woNumber}</strong>. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 bg-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
