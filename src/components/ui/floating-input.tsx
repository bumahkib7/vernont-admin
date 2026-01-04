"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";

type FloatingInputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string;
  topLabel?: string;
  error?: string;
};

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ type, name, label, topLabel, required, error, className, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [showPassword, setShowPassword] = React.useState(false);
    const [inputType, setInputType] = React.useState(type);

    React.useEffect(() => {
      if (type === "password" && showPassword) {
        setInputType("text");
      }
      if (type === "password" && !showPassword) {
        setInputType("password");
      }
    }, [type, showPassword]);

    React.useImperativeHandle(ref, () => inputRef.current!);

    return (
      <div className="flex flex-col w-full">
        {topLabel && (
          <Label className="mb-2 text-small-semi">{topLabel}</Label>
        )}
        <div className="flex relative z-0 w-full text-base-regular">
          <input
            type={inputType}
            name={name}
            id={name}
            placeholder=" "
            required={required}
            className={cn(
              "peer pt-4 pb-1 block w-full h-11 px-4 mt-0 bg-muted border rounded-md appearance-none",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
              "border-input hover:bg-muted/80 transition-colors",
              error && "border-destructive focus:ring-destructive",
              className
            )}
            {...props}
            ref={inputRef}
          />
          <label
            htmlFor={name}
            onClick={() => inputRef.current?.focus()}
            className={cn(
              "flex items-center justify-center mx-3 px-1 transition-all absolute duration-300 top-3 -z-1 origin-0",
              "text-muted-foreground pointer-events-none",
              "peer-focus:-translate-y-2 peer-focus:text-[10px]",
              "peer-[:not(:placeholder-shown)]:-translate-y-2 peer-[:not(:placeholder-shown)]:text-[10px]"
            )}
          >
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </label>
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground px-4 focus:outline-none transition-all duration-150 outline-none focus:text-foreground absolute right-0 top-3"
            >
              {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && (
          <span className="text-destructive text-small-regular mt-1">{error}</span>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";

export { FloatingInput };
