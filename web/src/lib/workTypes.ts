// Work Types Configuration
// Different work types have different fields and workflows

export const WORK_TYPES = {
  maintenance: {
    code: 'maintenance',
    label: 'Maintenance',
    icon: 'Wrench',
    description: 'Equipment/machinery maintenance work',
    color: 'bg-orange-500',
    departments: ['maintenance', 'operation', 'it'],
    fields: ['assetId', 'equipmentType', 'maintenanceType', 'urgency'],
    workflow: ['raised', 'assigned_to_supervisor', 'assigned_to_technician', 'in_progress', 'need_to_buy', 'fixed', 'completed'],
  },
  it: {
    code: 'it',
    label: 'IT Support',
    icon: 'Monitor',
    description: 'IT equipment and software issues',
    color: 'bg-blue-500',
    departments: ['it'],
    fields: ['deviceType', 'software', 'issueType', 'networkRelated'],
    workflow: ['raised', 'assigned_to_supervisor', 'assigned_to_technician', 'in_progress', 'need_to_buy', 'fixed', 'completed'],
  },
  graphic_design: {
    code: 'graphic_design',
    label: 'Graphic Design',
    icon: 'Palette',
    description: 'Design work for marketing materials',
    color: 'bg-pink-500',
    departments: ['marketing', 'admin'],
    fields: ['designType', 'dimensions', 'fileFormat', 'deadline', 'brandGuidelines'],
    workflow: ['raised', 'assigned_to_supervisor', 'assigned_to_designer', 'in_progress', 'review', 'revisions', 'approved', 'completed'],
  },
  marketing: {
    code: 'marketing',
    label: 'Marketing',
    icon: 'Megaphone',
    description: 'Marketing campaigns and promotions',
    color: 'bg-purple-500',
    departments: ['marketing'],
    fields: ['campaignType', 'targetAudience', 'budget', 'startDate', 'endDate'],
    workflow: ['raised', 'assigned_to_supervisor', 'assigned_to_marketing', 'planning', 'approval', 'execution', 'completed'],
  },
  purchasing: {
    code: 'purchasing',
    label: 'Purchasing',
    icon: 'ShoppingCart',
    description: 'Purchase requests and procurement',
    color: 'bg-green-500',
    departments: ['purchasing', 'accounts'],
    fields: ['vendor', 'items', 'budget', 'urgency', 'justification'],
    workflow: ['raised', 'assigned_to_supervisor', 'quotation', 'approval', 'purchase', 'delivery', 'completed'],
  },
  hr: {
    code: 'hr',
    label: 'HR Request',
    icon: 'Users',
    description: 'Human resources related requests',
    color: 'bg-red-500',
    departments: ['hr'],
    fields: ['requestType', 'employeeName', 'effectiveDate', 'details'],
    workflow: ['raised', 'assigned_to_supervisor', 'assigned_to_hr', 'processing', 'approval', 'completed'],
  },
  accounts: {
    code: 'accounts',
    label: 'Accounts/Finance',
    icon: 'Calculator',
    description: 'Finance and accounting requests',
    color: 'bg-yellow-500',
    departments: ['accounts'],
    fields: ['requestType', 'amount', 'vendor', 'invoiceNumber', 'paymentMethod'],
    workflow: ['raised', 'assigned_to_supervisor', 'assigned_to_accounts', 'processing', 'approval', 'payment', 'completed'],
  },
  general: {
    code: 'general',
    label: 'General',
    icon: 'Clipboard',
    description: 'General administrative work',
    color: 'bg-gray-500',
    departments: ['admin', 'operation'],
    fields: ['category', 'details'],
    workflow: ['raised', 'assigned_to_supervisor', 'in_progress', 'completed'],
  },
};

// Work type specific fields
export const WORK_TYPE_FIELDS = {
  designType: {
    label: 'Design Type',
    type: 'select',
    options: ['Banner', 'Flyer', 'Logo', 'Social Media', 'Brochure', 'Poster', 'Business Card', 'Other'],
  },
  dimensions: {
    label: 'Dimensions',
    type: 'text',
    placeholder: 'e.g., 1080x1080px, A4, A3',
  },
  fileFormat: {
    label: 'Required File Format',
    type: 'select',
    options: ['PDF', 'PNG', 'JPG', 'AI', 'PSD', 'SVG', 'All Formats'],
  },
  brandGuidelines: {
    label: 'Brand Guidelines',
    type: 'textarea',
    placeholder: 'Any specific brand colors, fonts, or guidelines to follow',
  },
  campaignType: {
    label: 'Campaign Type',
    type: 'select',
    options: ['Social Media', 'Email', 'Print', 'Event', 'Promotion', 'Launch', 'Other'],
  },
  targetAudience: {
    label: 'Target Audience',
    type: 'textarea',
    placeholder: 'Who is the target audience for this campaign?',
  },
  deviceType: {
    label: 'Device Type',
    type: 'select',
    options: ['Computer', 'Laptop', 'Printer', 'Network Device', 'Server', 'Phone', 'Other'],
  },
  software: {
    label: 'Software/Application',
    type: 'text',
    placeholder: 'e.g., Windows, Office, ERP, Email',
  },
  maintenanceType: {
    label: 'Maintenance Type',
    type: 'select',
    options: ['Preventive', 'Corrective', 'Emergency', 'Upgrade', 'Inspection'],
  },
  equipmentType: {
    label: 'Equipment Type',
    type: 'text',
    placeholder: 'e.g., Generator, AC, Vehicle, Machine',
  },
  requestType: {
    label: 'Request Type',
    type: 'select',
    options: ['Leave', 'Overtime', 'Recruitment', 'Training', 'Complaint', 'Other'],
  },
  vendor: {
    label: 'Vendor/Supplier',
    type: 'text',
    placeholder: 'Preferred vendor name',
  },
  justification: {
    label: 'Justification',
    type: 'textarea',
    placeholder: 'Why is this purchase needed?',
  },
  category: {
    label: 'Category',
    type: 'select',
    options: ['Meeting', 'Event', 'Training', 'Travel', 'Other'],
  },
};

// Helper functions
export function getWorkTypeConfig(typeCode: string) {
  return WORK_TYPES[typeCode as keyof typeof WORK_TYPES] || WORK_TYPES.general;
}

export function getWorkTypeFields(typeCode: string) {
  const config = getWorkTypeConfig(typeCode);
  return config.fields || [];
}

export function getWorkTypeColor(typeCode: string) {
  const config = getWorkTypeConfig(typeCode);
  return config.color || 'bg-gray-500';
}

export function getWorkTypeLabel(typeCode: string) {
  const config = getWorkTypeConfig(typeCode);
  return config.label || typeCode;
}

// Department to Work Type mapping
export const DEPARTMENT_WORK_TYPES: Record<string, string[]> = {
  it: ['it', 'general'],
  maintenance: ['maintenance', 'general'],
  operation: ['maintenance', 'general'],
  marketing: ['graphic_design', 'marketing'],
  purchasing: ['purchasing'],
  accounts: ['accounts'],
  hr: ['hr'],
  admin: ['general', 'graphic_design', 'marketing'],
  inventory: ['purchasing'],
};
