"use client";

import { useState } from "react";
import type { ResourceType } from "@/lib/resource-types.ts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ResourceTypeSelect } from "@/components/resource-type-select";

export interface ResourceEditorValue {
  title: string;
  url: string;
  type: ResourceType;
  summary: string;
  tags: string;
}

const EMPTY_RESOURCE: ResourceEditorValue = {
  title: "",
  url: "",
  type: "web",
  summary: "",
  tags: "",
};

interface ResourceEditorProps {
  initialValue?: ResourceEditorValue;
  title: string;
  description: string;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (value: ResourceEditorValue) => Promise<void> | void;
  onCancel?: () => void;
}

export function ResourceEditor({
  initialValue,
  title,
  description,
  submitLabel,
  pending = false,
  onSubmit,
  onCancel,
}: ResourceEditorProps) {
  const [value, setValue] = useState<ResourceEditorValue>(
    initialValue ?? EMPTY_RESOURCE
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(value);
    if (!initialValue) {
      setValue(EMPTY_RESOURCE);
    }
  }

  return (
    <Card className="border">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-[1.6fr_0.8fr]">
            <Input
              placeholder="Resource title"
              required
              value={value.title}
              onChange={(event) =>
                setValue((current) => ({ ...current, title: event.target.value }))
              }
            />
            <ResourceTypeSelect
              value={value.type}
              onChange={(type) => setValue((current) => ({ ...current, type }))}
            />
          </div>

          <Input
            placeholder="https://..."
            required
            value={value.url}
            onChange={(event) =>
              setValue((current) => ({ ...current, url: event.target.value }))
            }
          />

          <Textarea
            placeholder="Write a short summary for this resource."
            rows={4}
            value={value.summary}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                summary: event.target.value,
              }))
            }
          />

          <Input
            placeholder="Tags, comma separated"
            value={value.tags}
            onChange={(event) =>
              setValue((current) => ({ ...current, tags: event.target.value }))
            }
          />

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : submitLabel}
            </Button>
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
