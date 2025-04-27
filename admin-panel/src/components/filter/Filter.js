import React, { useState } from "react";

export const FormFilterPopup = ({ setFilter }) => {
  const [filters, setFilters] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fields = [
    { key: "name", label: "Name" },
    { key: "commander", label: "Commander" },
    { key: "eventDescription", label: "Event Description" },
    { key: "occurrence", label: "Occurrence" },
    { key: "damage", label: "Damage" },
    { key: "prevention", label: "Prevention" },
    { key: "date", label: "Date" },
    { key: "requestDateTime", label: "Request DateTime" },
    { key: "columnId", label: "Column ID" },
    { key: "punishment", label: "Punishment" },
  ];

  const handleChange = (key, value) => {
    setFilters((prev) => {
      const existing = prev.find((f) => f.key === key);
      if (existing) {
        return prev.map((f) => (f.key === key ? { ...f, value } : f));
      }
      return [...prev, { key, value }];
    });
  };

  const applyFilters = () => {
    setFilter(filters.filter((f) => f.value !== ""));
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Filter
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-64 rounded-lg bg-white shadow-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Set Filters</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {fields.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700">
                  {label}
                </label>
                <input
                  type="text"
                  value={filters.find((f) => f.key === key)?.value || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="mt-1 block w-full rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-sm border border-gray-400 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={applyFilters}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
