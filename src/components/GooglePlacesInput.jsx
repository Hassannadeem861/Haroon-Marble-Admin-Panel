import React, { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import './GooglePlacesInput.css'
/**
 * GooglePlacesInput
 *
 * Props:
 *  label        — field label string
 *  value        — current label string from Formik
 *  onChange     — called with { label, lat, lng } when a place is selected
 *  onClear      — called when user clears the field
 *  disabled     — boolean
 *  placeholder  — input placeholder
 *  error        — error string from Formik
 *  touched      — touched boolean from Formik
 *
 * Usage in Formik:
 *  <GooglePlacesInput
 *    label="Location"
 *    value={values.location_label}
 *    onChange={({ label, lat, lng }) => {
 *      setFieldValue("location_label", label);
 *      setFieldValue("location_lat",   lat);
 *      setFieldValue("location_lng",   lng);
 *    }}
 *    onClear={() => {
 *      setFieldValue("location_label", "");
 *      setFieldValue("location_lat",   "");
 *      setFieldValue("location_lng",   "");
 *    }}
 *    error={touched.location_label && errors.location_label}
 *    touched={touched.location_label}
 *    disabled={isSaving}
 *  />
 */

const GooglePlacesInput = ({
  label,
  value,
  onChange,
  onClear,
  disabled   = false,
  placeholder = "Search location…",
  error,
  touched,
}) => {
  const inputRef      = useRef(null);
  const autocompleteRef = useRef(null);
  const [inputVal, setInputVal] = useState(value || "");

  // ── Keep local state in sync with Formik value
  useEffect(() => {
    setInputVal(value || "");
  }, [value]);

  // ── Initialize Google Places Autocomplete
  useEffect(() => {
    // Guard: Google Maps must be loaded
    if (!window.google?.maps?.places) {
      console.warn("Google Maps Places library not loaded. Add script to index.html.");
      return;
    }
    if (!inputRef.current) return;

    // Create Autocomplete instance
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["geocode"],  // cities, addresses, regions
      fields: ["geometry", "formatted_address", "name"],
    });

    // On place selected
    const listener = autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();

      if (!place?.geometry?.location) {
        // User typed something but didn't select from dropdown
        return;
      }

      const lat   = place.geometry.location.lat();
      const lng   = place.geometry.location.lng();
      const label = place.formatted_address || place.name || "";

      setInputVal(label);
      onChange({ label, lat, lng });
    });

    // Cleanup
    return () => {
      if (window.google?.maps?.event) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, []);  // run once on mount

  const handleClear = () => {
    setInputVal("");
    if (inputRef.current) inputRef.current.value = "";
    onClear?.();
  };

  const handleManualChange = (e) => {
    // User is typing manually — just update display value
    // onChange will fire only when a place is selected from dropdown
    setInputVal(e.target.value);
    if (!e.target.value) onClear?.();
  };

  return (
    <div className="gp-field">
      {label && (
        <label className="gp-label">
          {label} <span className="gp-req">*</span>
        </label>
      )}

      <div className={`gp-wrap ${touched && error ? "gp-err" : ""} ${disabled ? "gp-disabled" : ""}`}>
        {/* Map pin icon */}
        <span className="gp-icon">
          <MapPin size={14} strokeWidth={1.8} />
        </span>

        {/* The actual input Google Autocomplete attaches to */}
        <input
          ref={inputRef}
          type="text"
          className="gp-input"
          placeholder={placeholder}
          value={inputVal}
          onChange={handleManualChange}
          disabled={disabled}
          autoComplete="off"
        />

        {/* Clear button */}
        {inputVal && !disabled && (
          <button type="button" className="gp-clear" onClick={handleClear}>
            <X size={12} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Selected location info (lat/lng preview) */}
      {value && (
        <div className="gp-preview">
          <MapPin size={10} strokeWidth={2} />
          <span className="gp-preview-text">{value}</span>
        </div>
      )}

      {/* Error */}
      {touched && error && (
        <p className="gp-err-txt">{error}</p>
      )}
    </div>
  );
};

export default GooglePlacesInput;