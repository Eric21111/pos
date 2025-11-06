import React from 'react';

const sizePresets = {
  md: { width: 100, height: 100, icon: 'w-10 h-10', padding: 'p-3' },
  sm: { width: 100, height: 100, icon: 'w-10 h-10', padding: 'p-3' }
};

export default function CategoryButtons({
  categories = [],
  selectedCategory,
  onSelect,
  size = 'md'
}) {
  const preset = sizePresets[size] || sizePresets.md;

  return (
    <>
      {categories.map((cat) => {
        const isActive = selectedCategory === cat.name;
        return (
          <button
            key={cat.name}
            onClick={() => onSelect(cat.name)}
            className={`flex flex-col items-center justify-center ${preset.padding} rounded-lg transition-all shrink-0 grow-0 ${
              isActive ? 'text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md hover:shadow-lg'
            }`}
            style={{
              width: `${preset.width}px`,
              minWidth: `${preset.width}px`,
              maxWidth: `${preset.width}px`,
              height: `${preset.height}px`,
              background: isActive
                ? 'linear-gradient(135deg, #AD7F65 0%, #76462B 100%)'
                : undefined
            }}
          >
            {cat.name === 'All' && cat.icon && typeof cat.icon !== 'string' ? (
              <div className={`text-3xl mb-1`}>{cat.icon}</div>
            ) : (
              <img
                src={cat.icon}
                alt={cat.name}
                className={`${preset.icon} mb-1 ${isActive ? 'brightness-0 invert' : ''}`}
              />
            )}
            <div className="text-xs font-medium text-center leading-tight w-full wrap-break-word">{cat.name}</div>
          </button>
        );
      })}
    </>
  );
}


