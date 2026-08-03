"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { ReaderSettingsT, ReaderTheme, ReaderLayout, ReadingDirection, PageTransition } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  settings: ReaderSettingsT;
  onUpdate: (patch: Partial<ReaderSettingsT>) => void;
}

const THEMES: { value: ReaderTheme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "sepia", label: "Sepia" },
  { value: "paper", label: "Paper" },
  { value: "night", label: "Night" },
  { value: "contrast", label: "High Contrast" },
];
const LAYOUTS: { value: ReaderLayout; label: string }[] = [
  { value: "continuous", label: "Continuous scroll" },
  { value: "single", label: "Single page" },
  { value: "two", label: "Two pages" },
];
const DIRECTIONS: { value: ReadingDirection; label: string }[] = [
  { value: "ltr", label: "Left to right" },
  { value: "rtl", label: "Right to left" },
];
const TRANSITIONS: { value: PageTransition; label: string }[] = [
  { value: "none", label: "None (instant)" },
  { value: "slide", label: "Slide" },
  { value: "fade", label: "Fade" },
];

export function SettingsDialog({ open, onOpenChange, settings, onUpdate }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle>Reader settings</DialogTitle>
          <DialogDescription>Customize your reading experience. Settings sync across devices when signed in.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Appearance */}
          <Section title="Appearance">
            <Row label="Reading theme">
              <Select value={settings.theme} onValueChange={(v) => onUpdate({ theme: v as ReaderTheme })}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>{THEMES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </Row>
          </Section>

          <Separator />

          {/* Layout */}
          <Section title="Layout">
            <Row label="Page layout">
              <Select value={settings.layout} onValueChange={(v) => onUpdate({ layout: v as ReaderLayout })}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>{LAYOUTS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </Row>
            <Row label="Reading direction">
              <Select value={settings.readingDirection} onValueChange={(v) => onUpdate({ readingDirection: v as ReadingDirection })}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>{DIRECTIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </Row>
            <Row label="Page transition">
              <Select value={settings.pageTransition} onValueChange={(v) => onUpdate({ pageTransition: v as PageTransition })}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>{TRANSITIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </Row>
            <Row label={`Page spacing · ${settings.pageSpacing}px`}>
              <Slider value={[settings.pageSpacing]} min={4} max={48} step={4} onValueChange={([v]) => onUpdate({ pageSpacing: v })} className="w-44" />
            </Row>
          </Section>

          <Separator />

          {/* Zoom */}
          <Section title="Zoom">
            <Row label={`Default zoom · ${Math.round(settings.zoom * 100)}%`}>
              <Slider value={[Math.round(settings.zoom * 100)]} min={50} max={300} step={10} onValueChange={([v]) => onUpdate({ zoom: v / 100 })} className="w-44" />
            </Row>
          </Section>

          <Separator />

          {/* Sidebars */}
          <Section title="Sidebars">
            <Row label="Default left sidebar tab">
              <Select value={settings.defaultSidebar} onValueChange={(v) => onUpdate({ defaultSidebar: v })}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="thumbnails">Thumbnails</SelectItem>
                  <SelectItem value="outline">Table of contents</SelectItem>
                  <SelectItem value="bookmarks">Bookmarks</SelectItem>
                  <SelectItem value="highlights">Highlights</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row label="Open left sidebar on launch">
              <Switch checked={settings.leftSidebarOpen} onCheckedChange={(v) => onUpdate({ leftSidebarOpen: v })} />
            </Row>
            <Row label="Open notes panel on launch">
              <Switch checked={settings.rightSidebarOpen} onCheckedChange={(v) => onUpdate({ rightSidebarOpen: v })} />
            </Row>
          </Section>

          <Separator />

          {/* Auto-save */}
          <Section title="Saving">
            <Row label={`Auto-save interval · ${settings.autoSaveSec}s`}>
              <Slider value={[settings.autoSaveSec]} min={2} max={30} step={1} onValueChange={([v]) => onUpdate({ autoSaveSec: v })} className="w-44" />
            </Row>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
