import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface Location {
  value: string;
  label: string;
  type?: string;
  id?: string;
}

interface SearchableLocationDropdownProps {
  locations: Location[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function SearchableLocationDropdown({
  locations,
  value,
  onChange,
  placeholder = 'Search location...',
  label,
  required = false,
}: SearchableLocationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get selected location label
  const selectedLocation = locations.find((loc) => (loc.value || loc.id) === value);

  // Filter locations based on search query (search any part of label)
  const filteredLocations = searchQuery.trim()
    ? locations.filter((loc) => {
        const searchLower = searchQuery.toLowerCase();
        const labelMatch = loc.label?.toLowerCase().includes(searchLower);
        const valueMatch = loc.value?.toLowerCase().includes(searchLower);
        const typeMatch = loc.type?.toLowerCase().includes(searchLower);
        return labelMatch || valueMatch || typeMatch;
      })
    : locations;

  // Group locations by type for display
  const groupedLocations = filteredLocations.reduce((acc, loc) => {
    const groupKey = loc.type || 'Other';
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(loc);
    return acc;
  }, {} as Record<string, Location[]>);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredLocations.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && filteredLocations[highlightedIndex]) {
      e.preventDefault();
      const loc = filteredLocations[highlightedIndex];
      onChange(loc.value || loc.id || '');
      setIsOpen(false);
      setSearchQuery('');
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (loc: Location) => {
    onChange(loc.value || loc.id || '');
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onChange('');
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const getLocationDisplayLabel = (loc: Location) => {
    const type = loc.type?.trim();
    const label = loc.label || '';
    const value = loc.value || loc.id || '';

    if (type && value && label) {
      return `${type} - ${value} - ${label}`;
    }
    if (type && label) {
      return `${type} - ${label}`;
    }
    return label || value || 'Unknown';
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="label flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Input field */}
      <div
        className={`relative flex items-center border rounded-lg bg-white transition-all ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Search className="h-4 w-4 text-gray-400 ml-3 flex-shrink-0" />

        {selectedLocation && !isOpen ? (
          <div className="flex-1 flex items-center py-2 px-2">
            <span className="text-sm text-gray-900 truncate">
              {getLocationDisplayLabel(selectedLocation)}
            </span>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchQuery : selectedLocation ? getLocationDisplayLabel(selectedLocation) : ''}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(0);
            }}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={selectedLocation ? getLocationDisplayLabel(selectedLocation) : placeholder}
            className="flex-1 py-2 px-2 text-sm bg-transparent outline-none min-w-0"
          />
        )}

        {selectedLocation && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 rounded-full mr-1"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 0);
            }
          }}
          className="p-2 hover:bg-gray-100 rounded-r-lg"
        >
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-auto">
          {filteredLocations.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No locations found matching "{searchQuery}"
            </div>
          ) : (
            <div className="py-1">
              {/* Show count */}
              <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-100">
                {filteredLocations.length} of {locations.length} locations
              </div>

              {/* Grouped locations */}
              {Object.entries(groupedLocations).map(([groupType, groupLocations]) => (
                <div key={groupType}>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
                    {groupType.charAt(0).toUpperCase() + groupType.slice(1)}
                  </div>
                  {groupLocations.map((loc, idx) => {
                    const globalIndex = filteredLocations.findIndex(
                      (l) => (l.value || l.id) === (loc.value || loc.id)
                    );
                    const isHighlighted = globalIndex === highlightedIndex;
                    const isSelected = (loc.value || loc.id) === value;

                    return (
                      <button
                        key={loc.value || loc.id || idx}
                        type="button"
                        onClick={() => handleSelect(loc)}
                        onMouseEnter={() => setHighlightedIndex(globalIndex)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          isHighlighted ? 'bg-blue-50' : ''
                        } ${isSelected ? 'bg-blue-100 text-blue-900 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <div className="flex flex-col">
                          <span>{getLocationDisplayLabel(loc)}</span>
                          {loc.value && loc.value !== loc.label && (
                            <span className="text-xs text-gray-400">Code: {loc.value}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
