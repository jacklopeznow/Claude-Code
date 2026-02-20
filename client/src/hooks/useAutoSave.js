import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for auto-saving form fields on change with debounce
 *
 * Usage:
 * const { value, onChange, isSaving } = useAutoSave('field_name', initialValue, saveFunction);
 *
 * @param {string} fieldName - Name/key of the field being saved
 * @param {*} initialValue - Initial value of the field
 * @param {Function} saveFunction - Async function that saves the value: async (value) => {}
 * @param {number} debounceDelay - Debounce delay in ms (default: 500)
 * @returns {Object} - { value, onChange, isSaving, error, isDirty }
 */
export function useAutoSave(fieldName, initialValue, saveFunction, debounceDelay = 500) {
  const [value, setValue] = React.useState(initialValue);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [isDirty, setIsDirty] = React.useState(false);

  // Refs to manage debouncing and tracking last saved value
  const debounceTimerRef = useRef(null);
  const lastSavedValueRef = useRef(initialValue);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle value changes with debounce
  const handleChange = useCallback(
    (newValue) => {
      setValue(newValue);
      setIsDirty(true);
      setError(null);

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(async () => {
        // Only save if value has actually changed
        if (newValue !== lastSavedValueRef.current) {
          setIsSaving(true);

          try {
            await saveFunction(newValue);
            lastSavedValueRef.current = newValue;
            setIsDirty(false);
            setError(null);
          } catch (err) {
            console.error(`Error saving ${fieldName}:`, err);
            setError(err.message || 'Failed to save changes');
            // Revert to last saved value on error
            setValue(lastSavedValueRef.current);
          } finally {
            setIsSaving(false);
          }
        }
      }, debounceDelay);
    },
    [fieldName, saveFunction, debounceDelay]
  );

  // Handle immediate save (useful for blur events)
  const saveImmediately = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value !== lastSavedValueRef.current) {
      setIsSaving(true);

      try {
        await saveFunction(value);
        lastSavedValueRef.current = value;
        setIsDirty(false);
        setError(null);
      } catch (err) {
        console.error(`Error saving ${fieldName}:`, err);
        setError(err.message || 'Failed to save changes');
        setValue(lastSavedValueRef.current);
      } finally {
        setIsSaving(false);
      }
    }
  }, [fieldName, saveFunction, value]);

  return {
    value,
    onChange: handleChange,
    isSaving,
    error,
    isDirty,
    saveImmediately,
  };
}

import React from 'react';

// Export as named export as well
export default useAutoSave;
