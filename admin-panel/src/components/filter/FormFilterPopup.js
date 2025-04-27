import React, { useState } from "react";
import "./FormFilterPopup.css";

export const FormFilterPopup = ({ filters, setFilters }) => {
  const [isOpen, setIsOpen] = useState(false);

  const fields = [
    { key: "name", label: "שם" },
    { key: "commander", label: "מפקד" },
    { key: "eventDescription", label: "אירוע" },
  ];

  const handleChange = (key, value) => {
    const newFilters = [...filters];
    const existingIndex = newFilters.findIndex((f) => f.key === key);

    if (existingIndex !== -1) {
      newFilters[existingIndex] = { key, value };
    } else {
      newFilters.push({ key, value });
    }

    const cleanFilters = newFilters.filter((f) => f.value !== "");
    setFilters(cleanFilters);
  };

  const clearFilters = () => {
    setFilters([]);
  };

  return (
    <div className="filter-popup">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="header-button"
      >
        סנן
      </button>

      {isOpen && (
        <div className="filter-menu">
          <h3 className="filter-title">הגדר סינון</h3>
          <div className="filter-fields">
            {fields.map(({ key, label }) => (
              <div key={key} className="filter-field">
                <label className="filter-label">{label}</label>
                <input
                  type="text"
                  value={filters.find((f) => f.key === key)?.value || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="filter-input"
                />
              </div>
            ))}
          </div>
          <div className="filter-actions">
            <button
              onClick={() => setIsOpen(false)}
              className="cancel-button"
            >
              סגור
            </button>
            <button
              onClick={clearFilters}
              className="clear-button"
            >
              נקה סינון
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
