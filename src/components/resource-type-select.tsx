"use client";

import { RESOURCE_TYPE_OPTIONS, type ResourceType } from "@/lib/resource-types.ts";

interface ResourceTypeSelectProps {
  value: ResourceType;
  onChange: (value: ResourceType) => void;
  disabled?: boolean;
}

export function ResourceTypeSelect({
  value,
  onChange,
  disabled = false,
}: ResourceTypeSelectProps) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as ResourceType)}
      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 transition focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {RESOURCE_TYPE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
