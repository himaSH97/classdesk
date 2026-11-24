"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const thresholdItems = [
  { value: "70", label: "Below 70%" },
  { value: "75", label: "Below 75%" },
  { value: "80", label: "Below 80%" },
  { value: "85", label: "Below 85%" },
];

const initial = {
  name: "Teacher Name",
  email: "teacher@school.edu",
  subject: "Mathematics",
  threshold: "80",
  alertLowAttendance: true,
  alertMessages: true,
  alertDueSoon: true,
  dailySummary: false,
};

/** One titled section of the settings page: description on the left, controls on the right. */
function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 px-5 py-6 md:grid-cols-[14rem_minmax(0,1fr)]">
      <div>
        <h2 className="font-medium">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsForm() {
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
      }}
    >
      <Card className="gap-0 py-0">
        <Section title="Profile" description="How you appear to students and in messages.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-name" className="text-xs font-medium text-muted-foreground">
                Name
              </Label>
              <Input id="settings-name" value={values.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-email" className="text-xs font-medium text-muted-foreground">
                School email
              </Label>
              <Input id="settings-email" type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="settings-subject" className="text-xs font-medium text-muted-foreground">
                Main subject
              </Label>
              <Input id="settings-subject" value={values.subject} onChange={(e) => set("subject", e.target.value)} />
            </div>
          </div>
        </Section>

        <Section title="Attendance" description="When a student is flagged for low attendance across the dashboard.">
          <Row label="Flag students" hint="Shown in Needs attention on the Overview">
            <Select items={thresholdItems} value={values.threshold} onValueChange={(v) => set("threshold", v ?? "80")}>
              <SelectTrigger aria-label="Attendance threshold" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {thresholdItems.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
        </Section>

        <Section title="Notifications" description="What you get told about, and when.">
          <Row label="Low attendance" hint="When a student drops below the threshold">
            <Switch checked={values.alertLowAttendance} onCheckedChange={(v) => set("alertLowAttendance", v)} aria-label="Low attendance alerts" />
          </Row>
          <Row label="New messages" hint="When a student sends you a message">
            <Switch checked={values.alertMessages} onCheckedChange={(v) => set("alertMessages", v)} aria-label="New message alerts" />
          </Row>
          <Row label="Due soon" hint="Two days before an assignment is due">
            <Switch checked={values.alertDueSoon} onCheckedChange={(v) => set("alertDueSoon", v)} aria-label="Due soon alerts" />
          </Row>
          <Row label="Daily summary" hint="A morning email with today's classes">
            <Switch checked={values.dailySummary} onCheckedChange={(v) => set("dailySummary", v)} aria-label="Daily summary" />
          </Row>
        </Section>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {saved && <p className="text-sm text-muted-foreground" role="status">Changes saved for this session.</p>}
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}
