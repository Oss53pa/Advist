import React from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

/**
 * A color picker component combining a visual color input with a text input.
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label }) => {
  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-advist-gray900">{label}</label>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-advist-border"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-advist-border rounded-lg text-sm font-mono uppercase text-advist-gray900"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};

export default ColorPicker;
