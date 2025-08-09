import React, { forwardRef } from 'react';

const FilterDropdown = forwardRef(({ filterType, onFilterChange }, ref) => {
  const filters = [
    { name: 'All Files', value: 'all' },
    { name: 'Folders', value: 'folders' },
    { name: 'Documents', value: 'documents' },
    { name: 'Images', value: 'images' },
    { name: 'Videos', value: 'videos' },
    { name: 'Audio', value: 'audio' },
    { name: 'Code', value: 'code' },
    { name: 'Archives', value: 'archives' },
    { name: 'Other', value: 'other' },
  ];

  return (
    <div
      id="filterDropdown"
      ref={ref}
      className="absolute right-0 mt-2 w-48 rounded-md shadow-lg dropdown-menu z-50"
    >
      <div
        className="py-1"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="filterButton"
      >
        {filters.map((filter) => (
          <button
            key={filter.value}
            className={`block w-full text-left px-4 py-2 text-sm dropdown-item ${filterType === filter.value ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            data-filter={filter.value}
            role="menuitem"
            onClick={() => onFilterChange(filter.value)}
          >
            {filter.name}
          </button>
        ))}
      </div>
    </div>
  );
});

export default FilterDropdown;
