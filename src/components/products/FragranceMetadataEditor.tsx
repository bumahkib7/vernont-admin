"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { X, Plus, Sparkles } from "lucide-react";

export interface FragranceNotes {
  top?: string[];
  heart?: string[];
  base?: string[];
}

export interface FragranceMetadata {
  notes?: FragranceNotes;
  concentration?: string;
  longevity?: number;
  sillage?: number;
  gender?: string;
  season?: string[];
  occasion?: string[];
  ingredients?: string;
}

interface FragranceMetadataEditorProps {
  value: FragranceMetadata;
  onChange: (metadata: FragranceMetadata) => void;
}

const CONCENTRATIONS = [
  { value: "parfum", label: "Parfum (Extrait)" },
  { value: "edp", label: "Eau de Parfum" },
  { value: "edt", label: "Eau de Toilette" },
  { value: "edc", label: "Eau de Cologne" },
  { value: "edm", label: "Eau de Mist" },
];

const GENDERS = [
  { value: "masculine", label: "Masculine" },
  { value: "feminine", label: "Feminine" },
  { value: "unisex", label: "Unisex" },
];

const SEASONS = [
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "fall", label: "Fall" },
  { value: "winter", label: "Winter" },
];

const OCCASIONS = [
  { value: "daily", label: "Daily Wear" },
  { value: "office", label: "Office" },
  { value: "date", label: "Date Night" },
  { value: "evening", label: "Evening" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "sport", label: "Sport" },
];

export function FragranceMetadataEditor({ value, onChange }: FragranceMetadataEditorProps) {
  const [topNote, setTopNote] = useState("");
  const [heartNote, setHeartNote] = useState("");
  const [baseNote, setBaseNote] = useState("");

  const updateMetadata = <K extends keyof FragranceMetadata>(
    key: K,
    newValue: FragranceMetadata[K]
  ) => {
    onChange({ ...value, [key]: newValue });
  };

  const addNote = (type: keyof FragranceNotes, note: string) => {
    if (!note.trim()) return;
    const currentNotes = value.notes || {};
    const currentTypeNotes = currentNotes[type] || [];
    if (!currentTypeNotes.includes(note.trim())) {
      updateMetadata("notes", {
        ...currentNotes,
        [type]: [...currentTypeNotes, note.trim()],
      });
    }
    // Clear input
    if (type === "top") setTopNote("");
    if (type === "heart") setHeartNote("");
    if (type === "base") setBaseNote("");
  };

  const removeNote = (type: keyof FragranceNotes, note: string) => {
    const currentNotes = value.notes || {};
    const currentTypeNotes = currentNotes[type] || [];
    updateMetadata("notes", {
      ...currentNotes,
      [type]: currentTypeNotes.filter((n) => n !== note),
    });
  };

  const toggleArrayValue = (key: "season" | "occasion", val: string) => {
    const current = value[key] || [];
    if (current.includes(val)) {
      updateMetadata(key, current.filter((v) => v !== val));
    } else {
      updateMetadata(key, [...current, val]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Fragrance Details
        </CardTitle>
        <CardDescription>
          Configure fragrance-specific attributes for this product
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notes Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Fragrance Notes</h4>

          {/* Top Notes */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Top Notes (opening)</Label>
            <div className="flex gap-2">
              <Input
                value={topNote}
                onChange={(e) => setTopNote(e.target.value)}
                placeholder="e.g., Bergamot, Lemon"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addNote("top", topNote);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => addNote("top", topNote)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {value.notes?.top && value.notes.top.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {value.notes.top.map((note) => (
                  <Badge key={note} variant="secondary" className="gap-1">
                    {note}
                    <button
                      type="button"
                      onClick={() => removeNote("top", note)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Heart Notes */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Heart Notes (middle)</Label>
            <div className="flex gap-2">
              <Input
                value={heartNote}
                onChange={(e) => setHeartNote(e.target.value)}
                placeholder="e.g., Rose, Jasmine"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addNote("heart", heartNote);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => addNote("heart", heartNote)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {value.notes?.heart && value.notes.heart.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {value.notes.heart.map((note) => (
                  <Badge key={note} variant="secondary" className="gap-1">
                    {note}
                    <button
                      type="button"
                      onClick={() => removeNote("heart", note)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Base Notes */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Base Notes (dry down)</Label>
            <div className="flex gap-2">
              <Input
                value={baseNote}
                onChange={(e) => setBaseNote(e.target.value)}
                placeholder="e.g., Sandalwood, Musk"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addNote("base", baseNote);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => addNote("base", baseNote)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {value.notes?.base && value.notes.base.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {value.notes.base.map((note) => (
                  <Badge key={note} variant="secondary" className="gap-1">
                    {note}
                    <button
                      type="button"
                      onClick={() => removeNote("base", note)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Concentration & Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Concentration</Label>
            <Select
              value={value.concentration || ""}
              onValueChange={(v) => updateMetadata("concentration", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select concentration" />
              </SelectTrigger>
              <SelectContent>
                {CONCENTRATIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <Select
              value={value.gender || ""}
              onValueChange={(v) => updateMetadata("gender", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Performance */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Performance</h4>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Longevity</Label>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {value.longevity || 5}/10
                </span>
              </div>
              <Slider
                value={[value.longevity || 5]}
                onValueChange={([v]) => updateMetadata("longevity", v)}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">How long the fragrance lasts on skin</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Sillage</Label>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {value.sillage || 5}/10
                </span>
              </div>
              <Slider
                value={[value.sillage || 5]}
                onValueChange={([v]) => updateMetadata("sillage", v)}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">How far the scent projects</p>
            </div>
          </div>
        </div>

        {/* Season */}
        <div className="space-y-2">
          <Label>Best Seasons</Label>
          <div className="flex flex-wrap gap-2">
            {SEASONS.map((s) => (
              <Badge
                key={s.value}
                variant={value.season?.includes(s.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArrayValue("season", s.value)}
              >
                {s.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Occasion */}
        <div className="space-y-2">
          <Label>Best Occasions</Label>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <Badge
                key={o.value}
                variant={value.occasion?.includes(o.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArrayValue("occasion", o.value)}
              >
                {o.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Ingredients */}
        <div className="space-y-2">
          <Label>Ingredients (INCI)</Label>
          <Textarea
            value={value.ingredients || ""}
            onChange={(e) => updateMetadata("ingredients", e.target.value)}
            placeholder="Alcohol Denat., Parfum/Fragrance, Aqua/Water..."
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground">Full ingredient list for regulatory compliance</p>
        </div>
      </CardContent>
    </Card>
  );
}
