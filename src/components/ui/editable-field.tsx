"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useToggleState from "@/hooks/use-toggle-state";

type EditableFieldProps = {
  label: string;
  currentValue: string | React.ReactNode;
  isSuccess?: boolean;
  isError?: boolean;
  errorMessage?: string;
  successMessage?: string;
  onClear?: () => void;
  children?: React.ReactNode;
  isLoading?: boolean;
  onSave?: () => void;
  "data-testid"?: string;
};

/**
 * Editable field component with disclosure pattern
 * Based on Medusa's AccountInfo component
 */
export function EditableField({
  label,
  currentValue,
  isSuccess,
  isError,
  errorMessage = "An error occurred, please try again",
  successMessage,
  onClear,
  children,
  isLoading,
  onSave,
  "data-testid": dataTestId,
}: EditableFieldProps) {
  const { state, close, toggle } = useToggleState();

  const handleToggle = () => {
    onClear?.();
    setTimeout(() => toggle(), 100);
  };

  React.useEffect(() => {
    if (isSuccess) {
      close();
    }
  }, [isSuccess, close]);

  return (
    <div className="text-small-regular" data-testid={dataTestId}>
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <span className="uppercase text-muted-foreground text-xsmall-regular tracking-wide">
            {label}
          </span>
          <div className="flex items-center flex-1 basis-0 justify-end gap-x-4 mt-1">
            {typeof currentValue === "string" ? (
              <span className="font-semibold" data-testid="current-info">
                {currentValue}
              </span>
            ) : (
              currentValue
            )}
          </div>
        </div>
        <div>
          <Button
            variant="secondary"
            size="sm"
            className="w-[100px]"
            onClick={handleToggle}
            type={state ? "reset" : "button"}
            data-testid="edit-button"
            data-active={state}
          >
            {state ? "Cancel" : "Edit"}
          </Button>
        </div>
      </div>

      {/* Success state */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isSuccess ? "max-h-[100px] opacity-100" : "max-h-0 opacity-0"
        )}
        data-testid="success-message"
      >
        <Badge className="p-2 my-4 bg-green-100 text-green-800 hover:bg-green-100">
          <span>{successMessage || `${label} updated successfully`}</span>
        </Badge>
      </div>

      {/* Error state */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isError ? "max-h-[100px] opacity-100" : "max-h-0 opacity-0"
        )}
        data-testid="error-message"
      >
        <Badge className="p-2 my-4 bg-red-100 text-red-800 hover:bg-red-100">
          <span>{errorMessage}</span>
        </Badge>
      </div>

      {/* Edit form */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-visible",
          state ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex flex-col gap-y-2 py-4">
          <div>{children}</div>
          <div className="flex items-center justify-end mt-2">
            <Button
              disabled={isLoading}
              className="w-full sm:max-w-[140px]"
              type="submit"
              onClick={onSave}
              data-testid="save-button"
            >
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
