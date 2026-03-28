// AI Automation Service
// Auto-creates work orders for high-risk assets and repeated failures
// Suggests preventive maintenance schedules

import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateAssetCode } from '@/lib/assetCode';

// Risk assessment rules
const RISK_RULES = {
  // High risk if asset has these characteristics
  HIGH_RISK_CONDITIONS: {
    ageThresholdMonths: 60, // Assets older than 5 years
    failureCountThreshold: 3, // 3+ failures in last 6 months
    criticality: ['critical', 'high'], // Critical/High priority assets
    lastMaintenanceThresholdDays: 90, // No PM in 90 days
  },
  
  // Repeated failure detection
  REPEATED_FAILURE: {
    timeWindowDays: 180, // 6 months
    sameAssetThreshold: 2, // 2+ work orders on same asset
    sameIssueThreshold: 2, // 2+ similar issues (by description keywords)
  }
};

// AI Analysis Result
interface AIAnalysisResult {
  shouldCreateWorkOrder: boolean;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  suggestedWorkType: string;
  suggestedDescription: string;
  preventiveMaintenanceRecommended: boolean;
  pmSchedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    nextDue: Date;
  };
}

// Analyze asset for risks and auto-generate work orders
export async function analyzeAssetForRisk(asset: any): Promise<AIAnalysisResult> {
  const result: AIAnalysisResult = {
    shouldCreateWorkOrder: false,
    reason: '',
    priority: 'low',
    suggestedWorkType: 'maintenance',
    suggestedDescription: '',
    preventiveMaintenanceRecommended: false,
  };

  const { HIGH_RISK_CONDITIONS } = RISK_RULES;
  const riskFactors: string[] = [];

  // Check asset age
  if (asset.purchaseDate) {
    const ageMonths = (Date.now() - asset.purchaseDate.toDate().getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (ageMonths > HIGH_RISK_CONDITIONS.ageThresholdMonths) {
      riskFactors.push(`Asset is ${Math.floor(ageMonths)} months old (threshold: ${HIGH_RISK_CONDITIONS.ageThresholdMonths})`);
      result.priority = 'medium';
    }
  }

  // Check failure history
  const failures = await getRecentFailures(asset.id, HIGH_RISK_CONDITIONS.failureCountThreshold);
  if (failures.length >= HIGH_RISK_CONDITIONS.failureCountThreshold) {
    riskFactors.push(`${failures.length} recent failures detected`);
    result.priority = 'high';
    result.shouldCreateWorkOrder = true;
    result.reason = 'Repeated failures indicate potential breakdown';
    result.suggestedDescription = `Asset ${asset.assetCode} has failed ${failures.length} times recently. Preventive inspection recommended.`;
  }

  // Check criticality
  if (HIGH_RISK_CONDITIONS.criticality.includes(asset.criticality || asset.priority)) {
    riskFactors.push('Critical asset classification');
    result.priority = 'high';
  }

  // Check last maintenance
  const lastPM = await getLastPreventiveMaintenance(asset.id);
  if (lastPM) {
    const daysSincePM = (Date.now() - lastPM.toDate().getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePM > HIGH_RISK_CONDITIONS.lastMaintenanceThresholdDays) {
      riskFactors.push(`No PM for ${Math.floor(daysSincePM)} days`);
      result.preventiveMaintenanceRecommended = true;
      result.pmSchedule = {
        frequency: asset.pmFrequency || 'monthly',
        nextDue: calculateNextPMDate(asset.pmFrequency || 'monthly'),
      };
      
      if (daysSincePM > HIGH_RISK_CONDITIONS.lastMaintenanceThresholdDays * 2) {
        result.shouldCreateWorkOrder = true;
        result.reason = 'Preventive maintenance overdue';
        result.suggestedDescription = `Critical asset ${asset.assetCode} is overdue for preventive maintenance by ${Math.floor(daysSincePM - HIGH_RISK_CONDITIONS.lastMaintenanceThresholdDays)} days.`;
        result.priority = asset.criticality === 'critical' ? 'critical' : 'high';
      }
    }
  } else {
    // No PM history
    riskFactors.push('No preventive maintenance history');
    result.preventiveMaintenanceRecommended = true;
  }

  // Compile analysis
  if (riskFactors.length > 0) {
    result.suggestedWorkType = determineWorkType(asset, failures);
  }

  return result;
}

// Detect repeated failures pattern
export async function detectRepeatedFailures(assetId: string): Promise<boolean> {
  const { REPEATED_FAILURE } = RISK_RULES;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - REPEATED_FAILURE.timeWindowDays);

  const q = query(
    collection(db, 'work_orders'),
    where('assetId', '==', assetId),
    where('status', 'in', ['completed', 'closed']),
    where('createdAt', '>=', cutoffDate)
  );

  const snap = await getDocs(q);
  const workOrders = snap.docs.map(d => d.data());

  if (workOrders.length < REPEATED_FAILURE.sameAssetThreshold) {
    return false;
  }

  // Check for similar issues
  const issueKeywords = extractKeywords(workOrders.map(wo => wo.description || wo.title));
  const repeatedIssues = findRepeatedIssues(issueKeywords, REPEATED_FAILURE.sameIssueThreshold);

  return repeatedIssues.length > 0;
}

// Auto-create work order if needed
export async function autoCreateWorkOrderIfNeeded(asset: any): Promise<{ created: boolean; workOrderId?: string }> {
  const analysis = await analyzeAssetForRisk(asset);

  if (!analysis.shouldCreateWorkOrder) {
    return { created: false };
  }

  // Check if similar auto-created WO already exists
  const existingCheck = query(
    collection(db, 'work_orders'),
    where('assetId', '==', asset.id),
    where('aiGenerated', '==', true),
    where('createdAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Within last 7 days
  );
  const existing = await getDocs(existingCheck);
  
  if (!existing.empty) {
    return { created: false }; // Already created recently
  }

  // Create the work order
  const woNumber = await generateWorkOrderNumber();
  const workOrderData = {
    woNumber,
    title: `AI-Detected: ${analysis.reason}`,
    description: analysis.suggestedDescription,
    assetId: asset.id,
    assetCode: asset.assetCode,
    location: asset.location,
    department: asset.department,
    workType: analysis.suggestedWorkType,
    priority: analysis.priority,
    status: 'raised',
    aiGenerated: true,
    aiReason: analysis.reason,
    preventiveMaintenanceRecommended: analysis.preventiveMaintenanceRecommended,
    pmSchedule: analysis.pmSchedule || null,
    createdBy: 'system_ai',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'work_orders'), workOrderData);
  
  return { created: true, workOrderId: docRef.id };
}

// Suggest preventive maintenance schedule
export function suggestPMSchedule(asset: any, failureHistory: any[]): {
  frequency: string;
  confidence: number;
  reasoning: string;
} {
  const failureCount = failureHistory.length;
  const ageMonths = asset.purchaseDate 
    ? (Date.now() - asset.purchaseDate.toDate().getTime()) / (1000 * 60 * 60 * 24 * 30)
    : 0;

  // Logic-based recommendation
  if (failureCount >= 3 || asset.criticality === 'critical') {
    return {
      frequency: 'weekly',
      confidence: 0.9,
      reasoning: 'High failure rate or critical asset requires frequent checks',
    };
  } else if (failureCount >= 2 || ageMonths > 60) {
    return {
      frequency: 'monthly',
      confidence: 0.8,
      reasoning: 'Moderate failure rate or aging asset needs regular monitoring',
    };
  } else if (failureCount >= 1 || ageMonths > 36) {
    return {
      frequency: 'quarterly',
      confidence: 0.7,
      reasoning: 'Some history of issues suggests periodic inspection',
    };
  } else {
    return {
      frequency: asset.pmFrequency || 'yearly',
      confidence: 0.5,
      reasoning: 'Standard maintenance schedule appropriate',
    };
  }
}

// Run AI analysis on all assets
export async function runAIPeriodicAnalysis(): Promise<{
  assetsAnalyzed: number;
  workOrdersCreated: number;
  recommendations: string[];
}> {
  const assetsSnap = await getDocs(collection(db, 'assets'));
  const assets = assetsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  let workOrdersCreated = 0;
  const recommendations: string[] = [];

  for (const asset of assets) {
    // Check for repeated failures
    const hasRepeatedFailures = await detectRepeatedFailures(asset.id);
    if (hasRepeatedFailures) {
      recommendations.push(`Asset ${asset.assetCode}: Repeated failures detected - investigate root cause`);
    }

    // Auto-create work order if needed
    const result = await autoCreateWorkOrderIfNeeded(asset);
    if (result.created) {
      workOrdersCreated++;
    }
  }

  return {
    assetsAnalyzed: assets.length,
    workOrdersCreated,
    recommendations,
  };
}

// Helper functions
async function getRecentFailures(assetId: string, limit: number) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const q = query(
    collection(db, 'work_orders'),
    where('assetId', '==', assetId),
    where('status', 'in', ['completed', 'closed', 'cancelled']),
    where('createdAt', '>=', sixMonthsAgo),
    where('type', 'in', ['repair', 'emergency', 'breakdown'])
  );

  const snap = await getDocs(q);
  return snap.docs.slice(0, limit);
}

async function getLastPreventiveMaintenance(assetId: string) {
  const q = query(
    collection(db, 'work_orders'),
    where('assetId', '==', assetId),
    where('type', '==', 'preventive_maintenance'),
    where('status', '==', 'completed')
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  // Get most recent
  const sorted = snap.docs.sort((a, b) => {
    const aDate = a.data().completedAt?.toDate() || 0;
    const bDate = b.data().completedAt?.toDate() || 0;
    return bDate - aDate;
  });

  return sorted[0].data().completedAt;
}

function determineWorkType(asset: any, failures: any[]): string {
  if (asset.type?.includes('electrical') || failures.some(f => f.data().description?.includes('electrical'))) {
    return 'electrical';
  }
  if (asset.type?.includes('mechanical') || failures.some(f => f.data().description?.includes('mechanical'))) {
    return 'mechanical';
  }
  return 'maintenance';
}

function extractKeywords(texts: string[]): Record<string, number> {
  const keywords: Record<string, number> = {};
  const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];

  for (const text of texts) {
    if (!text) continue;
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length < 3 || stopWords.includes(word)) continue;
      keywords[word] = (keywords[word] || 0) + 1;
    }
  }

  return keywords;
}

function findRepeatedIssues(keywords: Record<string, number>, threshold: number): string[] {
  return Object.entries(keywords)
    .filter(([_, count]) => count >= threshold)
    .map(([word]) => word);
}

function calculateNextPMDate(frequency: string): Date {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
    case 'quarterly':
      now.setMonth(now.getMonth() + 3);
      break;
    case 'yearly':
      now.setFullYear(now.getFullYear() + 1);
      break;
  }
  return now;
}

async function generateWorkOrderNumber(): Promise<string> {
  const prefix = 'WO-AI';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}
