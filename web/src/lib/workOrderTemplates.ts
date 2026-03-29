// Work Order Templates
// Pre-filled templates for common maintenance tasks

export interface WorkOrderTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultPriority: string;
  defaultWorkType: string;
  estimatedHours: number;
  checklist: string[];
  partsRequired: { name: string; quantity: number }[];
}

export const WORK_ORDER_TEMPLATES: WorkOrderTemplate[] = [
  {
    id: 'hvac_maintenance',
    name: 'HVAC System Maintenance',
    description: 'Regular preventive maintenance for HVAC units including filter replacement, coil cleaning, and system inspection',
    category: 'mechanical',
    defaultPriority: 'medium',
    defaultWorkType: 'preventive',
    estimatedHours: 4,
    checklist: [
      'Replace air filters',
      'Clean condenser coils',
      'Check refrigerant levels',
      'Inspect ductwork for leaks',
      'Test thermostat operation',
      'Lubricate moving parts',
      'Check electrical connections'
    ],
    partsRequired: [
      { name: 'Air Filter (20x20x1)', quantity: 2 },
      { name: 'Refrigerant R-410A', quantity: 1 }
    ]
  },
  {
    id: 'electrical_inspection',
    name: 'Electrical Panel Inspection',
    description: 'Comprehensive inspection of electrical panels, breakers, and connections',
    category: 'electrical',
    defaultPriority: 'high',
    defaultWorkType: 'inspection',
    estimatedHours: 2,
    checklist: [
      'Visual inspection of panel',
      'Test all breakers',
      'Check for loose connections',
      'Verify grounding',
      'Check for overheating signs',
      'Test emergency shutoff',
      'Label verification'
    ],
    partsRequired: []
  },
  {
    id: 'plumbing_repair',
    name: 'Plumbing Leak Repair',
    description: 'Repair water leaks in pipes, fixtures, or fittings',
    category: 'plumbing',
    defaultPriority: 'critical',
    defaultWorkType: 'corrective',
    estimatedHours: 3,
    checklist: [
      'Locate and assess leak',
      'Shut off water supply',
      'Drain affected lines',
      'Replace damaged parts',
      'Test for leaks',
      'Restore water supply',
      'Clean work area'
    ],
    partsRequired: [
      { name: 'Pipe sealant tape', quantity: 1 },
      { name: 'Replacement fittings', quantity: 2 }
    ]
  },
  {
    id: 'generator_service',
    name: 'Generator Preventive Service',
    description: 'Regular service for backup generator including oil change, filter replacement, and load testing',
    category: 'mechanical',
    defaultPriority: 'high',
    defaultWorkType: 'preventive',
    estimatedHours: 6,
    checklist: [
      'Change engine oil',
      'Replace oil filter',
      'Replace fuel filter',
      'Check air filter',
      'Test battery voltage',
      'Run load test',
      'Check coolant level',
      'Inspect belts and hoses'
    ],
    partsRequired: [
      { name: 'Engine Oil (10W-30)', quantity: 5 },
      { name: 'Oil Filter', quantity: 1 },
      { name: 'Fuel Filter', quantity: 1 }
    ]
  },
  {
    id: 'lighting_upgrade',
    name: 'LED Lighting Upgrade',
    description: 'Replace existing lighting with energy-efficient LED fixtures',
    category: 'electrical',
    defaultPriority: 'low',
    defaultWorkType: 'upgrade',
    estimatedHours: 2,
    checklist: [
      'Assess current lighting',
      'Remove old fixtures',
      'Install LED fixtures',
      'Verify proper wiring',
      'Test all lights',
      'Dispose of old fixtures'
    ],
    partsRequired: [
      { name: 'LED Panel Light', quantity: 4 },
      { name: 'Wire nuts', quantity: 10 }
    ]
  },
  {
    id: 'fire_safety_check',
    name: 'Fire Safety Equipment Check',
    description: 'Inspect and test fire extinguishers, smoke detectors, and emergency lighting',
    category: 'safety',
    defaultPriority: 'critical',
    defaultWorkType: 'inspection',
    estimatedHours: 2,
    checklist: [
      'Inspect fire extinguishers',
      'Check pressure gauges',
      'Test smoke detectors',
      'Verify emergency lighting',
      'Check exit signs',
      'Test alarm system',
      'Update inspection tags'
    ],
    partsRequired: [
      { name: 'Smoke detector batteries', quantity: 10 }
    ]
  },
  {
    id: 'lift_maintenance',
    name: 'Lift/Elevator Maintenance',
    description: 'Preventive maintenance for elevators including safety checks and lubrication',
    category: 'mechanical',
    defaultPriority: 'high',
    defaultWorkType: 'preventive',
    estimatedHours: 4,
    checklist: [
      'Test emergency stop',
      'Check door operation',
      'Lubricate guide rails',
      'Inspect cables',
      'Test intercom',
      'Check leveling accuracy',
      'Verify safety sensors'
    ],
    partsRequired: [
      { name: 'Lift lubricant', quantity: 2 }
    ]
  },
  {
    id: 'network_cabling',
    name: 'Network Cable Installation',
    description: 'Install or repair network cabling infrastructure',
    category: 'it',
    defaultPriority: 'medium',
    defaultWorkType: 'installation',
    estimatedHours: 4,
    checklist: [
      'Plan cable route',
      'Run CAT6 cables',
      'Terminate at both ends',
      'Test connections',
      'Label cables',
      'Update network diagram',
      'Cable management'
    ],
    partsRequired: [
      { name: 'CAT6 Cable (box)', quantity: 1 },
      { name: 'RJ45 Connectors', quantity: 20 },
      { name: 'Cable ties', quantity: 50 }
    ]
  }
];

// Helper function to apply template to work order form
export function applyTemplate(templateId: string): Partial<WorkOrderTemplate> | null {
  const template = WORK_ORDER_TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;
  
  return {
    title: template.name,
    description: template.description,
    category: template.category,
    priority: template.defaultPriority,
    workType: template.defaultWorkType,
    estimatedHours: template.estimatedHours.toString(),
    checklist: [...template.checklist],
    partsRequired: [...template.partsRequired]
  };
}

// Get templates by category
export function getTemplatesByCategory(): Record<string, WorkOrderTemplate[]> {
  return WORK_ORDER_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, WorkOrderTemplate[]>);
}
