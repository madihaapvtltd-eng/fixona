import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import { collection, getDocs, query, where, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { runAIPeriodicAnalysis, analyzeAssetForRisk, suggestPMSchedule } from '@/lib/aiAutomation';
import { Brain, AlertTriangle, TrendingUp, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function AIDashboardPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  // Fetch high-risk assets
  const { data: highRiskAssets, isLoading: loadingAssets } = useQuery(
    'highRiskAssets',
    async () => {
      const assetsSnap = await getDocs(collection(db, 'assets'));
      const assets = assetsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Analyze each asset for risk
      const riskAnalysis = await Promise.all(
        assets.map(async (asset) => {
          const analysis = await analyzeAssetForRisk(asset);
          return { ...asset, analysis };
        })
      );
      
      return riskAnalysis.filter(a => a.analysis.shouldCreateWorkOrder || a.analysis.preventiveMaintenanceRecommended);
    }
  );

  // Fetch recent AI-generated work orders
  const { data: aiWorkOrders } = useQuery(
    'aiWorkOrders',
    async () => {
      const q = query(
        collection(db, 'work_orders'),
        where('aiGenerated', '==', true),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  );

  // Run full AI analysis
  const runAnalysisMutation = useMutation(
    async () => {
      setIsAnalyzing(true);
      const results = await runAIPeriodicAnalysis();
      setAnalysisResults(results);
      return results;
    },
    {
      onSuccess: (results) => {
        toast.success(`Analysis complete! Created ${results.workOrdersCreated} work orders`);
        setIsAnalyzing(false);
      },
      onError: () => {
        toast.error('Analysis failed');
        setIsAnalyzing(false);
      },
    }
  );

  // Get PM suggestions for assets
  const getPMSuggestions = async (assetId: string) => {
    const assetDoc = await getDocs(query(collection(db, 'assets'), where('__name__', '==', assetId)));
    if (assetDoc.empty) return null;
    
    const asset = { id: assetDoc.docs[0].id, ...assetDoc.docs[0].data() };
    
    // Get failure history
    const failuresQuery = query(
      collection(db, 'work_orders'),
      where('assetId', '==', assetId),
      where('status', 'in', ['completed', 'closed']),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const failuresSnap = await getDocs(failuresQuery);
    const failures = failuresSnap.docs.map(d => d.data());
    
    return suggestPMSchedule(asset, failures);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-purple-600" />
            AI Maintenance Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Automated risk analysis and preventive maintenance suggestions
          </p>
        </div>
        <button
          onClick={() => runAnalysisMutation.mutate()}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">High Risk Assets</p>
              <p className="text-2xl font-bold">{highRiskAssets?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Brain className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">AI Work Orders</p>
              <p className="text-2xl font-bold">{aiWorkOrders?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">PM Suggestions</p>
              <p className="text-2xl font-bold">
                {highRiskAssets?.filter(a => a.analysis.preventiveMaintenanceRecommended).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overdue PM</p>
              <p className="text-2xl font-bold">
                {highRiskAssets?.filter(a => a.analysis.priority === 'critical').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* High Risk Assets */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          High Risk Assets Requiring Attention
        </h2>
        
        {loadingAssets ? (
          <p className="text-gray-500">Loading...</p>
        ) : highRiskAssets?.length === 0 ? (
          <p className="text-gray-500">No high-risk assets detected</p>
        ) : (
          <div className="space-y-3">
            {highRiskAssets?.map((asset: any) => (
              <div key={asset.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{asset.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        asset.analysis.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        asset.analysis.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {asset.analysis.priority} priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{asset.assetCode}</p>
                    <p className="text-sm text-red-600 mt-2">
                      {asset.analysis.reason}
                    </p>
                    {asset.analysis.pmSchedule && (
                      <p className="text-sm text-blue-600 mt-1">
                        Suggested PM: {asset.analysis.pmSchedule.frequency}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      const suggestion = await getPMSuggestions(asset.id);
                      if (suggestion) {
                        toast.success(`PM confidence: ${Math.round(suggestion.confidence * 100)}% - ${suggestion.reasoning}`);
                      }
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View PM Suggestion
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI-Generated Work Orders */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          AI-Generated Work Orders
        </h2>
        
        {aiWorkOrders?.length === 0 ? (
          <p className="text-gray-500">No AI-generated work orders yet</p>
        ) : (
          <div className="space-y-3">
            {aiWorkOrders?.map((wo: any) => (
              <div key={wo.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{wo.title}</h3>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
                        AI Generated
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{wo.woNumber}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {wo.aiReason || 'Risk-based auto-generation'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Created: {wo.createdAt ? format(wo.createdAt.toDate(), 'MMM d, yyyy HH:mm') : 'Unknown'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    wo.status === 'completed' ? 'bg-green-100 text-green-800' :
                    wo.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {wo.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysisResults && (
        <div className="card bg-purple-50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Latest Analysis Results
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-3">
              <p className="text-sm text-gray-500">Assets Analyzed</p>
              <p className="text-2xl font-bold text-purple-600">
                {analysisResults.assetsAnalyzed}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-sm text-gray-500">Work Orders Created</p>
              <p className="text-2xl font-bold text-green-600">
                {analysisResults.workOrdersCreated}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-sm text-gray-500">Recommendations</p>
              <p className="text-2xl font-bold text-blue-600">
                {analysisResults.recommendations.length}
              </p>
            </div>
          </div>
          
          {analysisResults.recommendations.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Key Recommendations:</p>
              <ul className="space-y-1">
                {analysisResults.recommendations.slice(0, 5).map((rec: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-purple-500">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
