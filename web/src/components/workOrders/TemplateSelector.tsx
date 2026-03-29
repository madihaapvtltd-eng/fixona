import { useState } from 'react';
import { WORK_ORDER_TEMPLATES, WorkOrderTemplate } from '@/lib/workOrderTemplates';
import { FileText, ChevronDown, Check, Clock, Package, Wrench } from 'lucide-react';

interface TemplateSelectorProps {
  onSelect: (template: WorkOrderTemplate) => void;
  selectedTemplateId?: string;
}

export function TemplateSelector({ onSelect, selectedTemplateId }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Group templates by category
  const templatesByCategory = WORK_ORDER_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, WorkOrderTemplate[]>);

  const categories = Object.keys(templatesByCategory);
  const selectedTemplate = WORK_ORDER_TEMPLATES.find(t => t.id === selectedTemplateId);

  return (
    <div className="relative">
      {/* Selected Template Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
          selectedTemplateId 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-200 hover:border-primary-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${selectedTemplateId ? 'bg-primary-100' : 'bg-gray-100'}`}>
            <FileText className={`h-5 w-5 ${selectedTemplateId ? 'text-primary-600' : 'text-gray-500'}`} />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">
              {selectedTemplate ? selectedTemplate.name : 'Select a Template'}
            </p>
            <p className="text-sm text-gray-500">
              {selectedTemplate 
                ? `${selectedTemplate.category} • ${selectedTemplate.estimatedHours}h estimated`
                : 'Choose from pre-filled maintenance templates'
              }
            </p>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
          {/* Categories */}
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 p-2 flex gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedCategory === null 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap capitalize ${
                  selectedCategory === cat 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Templates List */}
          <div className="p-2 space-y-1">
            {(selectedCategory ? templatesByCategory[selectedCategory] : WORK_ORDER_TEMPLATES).map(template => (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  onSelect(template);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedTemplateId === template.id
                    ? 'bg-primary-50 border border-primary-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {selectedTemplateId === template.id ? (
                      <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{template.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        template.defaultPriority === 'critical' ? 'bg-red-100 text-red-700' :
                        template.defaultPriority === 'high' ? 'bg-orange-100 text-orange-700' :
                        template.defaultPriority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {template.defaultPriority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                    
                    {/* Quick stats */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {template.estimatedHours}h
                      </span>
                      {template.partsRequired.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {template.partsRequired.length} parts
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Wrench className="h-3 w-3" />
                        {template.checklist.length} tasks
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Clear selection */}
          {selectedTemplateId && (
            <div className="border-t border-gray-200 p-2">
              <button
                type="button"
                onClick={() => {
                  onSelect(null as any);
                  setIsOpen(false);
                }}
                className="w-full text-center py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear selection (blank work order)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
