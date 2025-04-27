import React, { useState, useRef, useEffect } from "react";
import "./FormFilterPopup.css";

export const FormFilterPopup = ({ filters, setFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef(null); // Reference to the popup

  const fields = [
    { key: "name", label: "שם" },
    { key: "commander", label: "מפקד" },
    { key: "eventDescription", label: "אירוע" },
    { key: "timeFrom", label: "ממתי", isTime: true },
    { key: "timeTo", label: "עד מתי ;)", isTime: true },
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="filter-popup" ref={popupRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`header-button ${filters.length > 0 ? "active-filter" : ""}`}
      >
        סנן
      </button>

      {isOpen && (
        <div className="filter-menu">
          <h3 className="filter-title">הגדר סינון</h3>
          <div className="filter-fields">
            {fields.map(({ key, label, isTime }) => (
              <div key={key} className="filter-field">
                <label className="filter-label">{label}</label>
                {
                  isTime
                    ? <input
                        type="datetime-local"
                        value={filters.find((f) => f.key === key)?.value || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="filter-input"
                      />
                    : <input
                        type="text"
                        value={filters.find((f) => f.key === key)?.value || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="filter-input"
                      />
                }
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
