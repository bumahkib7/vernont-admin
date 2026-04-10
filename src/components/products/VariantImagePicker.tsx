"use client";

import { useRef, useState } from "react";
import { Check, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addProductImage,
  resolveImageUrl,
  uploadProductImage,
} from "@/lib/api";

interface VariantImagePickerProps {
  productImages: { id: string; url: string; altText?: string | null }[];
  value: string | null;
  onChange: (url: string | null) => void;
  productId: string;
  onImageUploaded?: () => void;
}

export function VariantImagePicker({
  productImages,
  value,
  onChange,
  productId,
  onImageUploaded,
}: VariantImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError("Image must be less than 25MB");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const uploadResult = await uploadProductImage(file, productId);
      if (!uploadResult.savedToProduct) {
        await addProductImage(productId, {
          url: uploadResult.url,
          position: productImages.length,
        });
      }
      onChange(uploadResult.url);
      onImageUploaded?.();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload image"
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isMatch = (imgUrl: string) => {
    if (!value) return false;
    // Compare both raw and resolved forms so we tolerate legacy vs CDN URLs.
    return (
      imgUrl === value ||
      resolveImageUrl(imgUrl) === resolveImageUrl(value) ||
      resolveImageUrl(imgUrl) === value ||
      imgUrl === resolveImageUrl(value)
    );
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {productImages.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Upload product images first, then assign one to this variant.
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload new
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {productImages.map((img) => {
            const resolved = resolveImageUrl(img.url);
            const selected = isMatch(img.url);
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => onChange(img.url)}
                className={`relative aspect-square overflow-hidden rounded-md border bg-muted transition-all ${
                  selected
                    ? "ring-2 ring-primary ring-offset-1"
                    : "hover:border-primary/50"
                }`}
              >
                {resolved ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolved}
                    alt={img.altText || ""}
                    className="h-full w-full object-cover"
                  />
                ) : null}
                {selected && (
                  <div className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleUploadClick}
            disabled={uploading}
            className="flex aspect-square items-center justify-center rounded-md border-2 border-dashed hover:border-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            ) : (
              <Upload className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>
      )}

      {value && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            Variant image selected
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
      )}
    </div>
  );
}
