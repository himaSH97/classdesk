"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { makeClass, WEEKDAYS } from "@/lib/create";
import type { ClassColor, ClassOverview, Weekday } from "@/lib/data";
import { RecordDialog, RecordField } from "./record-dialog";

const gradeItems = ["Grade 9", "Grade 10", "Grade 11", "Grade 12"].map((g) => ({ value: g, label: g }));
const colors: ClassColor[] = ["violet", "amber", "sky", "rose", "emerald", "indigo"];
const swatch: Record<ClassColor, string> = {
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  sky: "bg-sky-500",
  rose: "bg-rose-500",
  emerald: "bg-emerald-500",
  indigo: "bg-indigo-500",
};
const weekdays = WEEKDAYS.slice(1, 6) as Weekday[];

export function CreateClassDialog({ onCreate }: { onCreate: (c: ClassOverview) => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("Grade 9");
  const [room, setRoom] = useState("");
  const [color, setColor] = useState<ClassColor>("violet");
  const [days, setDays] = useState<Weekday[]>([]);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");

  function submit() {
    if (!name.trim()) return "Give the class a name.";
    if (!/^[A-Za-z]{2,5}-?\d{2,4}$/.test(code.trim())) return "Use a class code like MATH-302.";
    if (days.length === 0) return "Pick at least one meeting day.";
    if (end <= start) return "The class must end after it starts.";
    onCreate(makeClass({ name, code, subject, grade, room, color, days, start, end }));
    setName("");
    setCode("");
    setSubject("");
    setRoom("");
    setDays([]);
    return null;
  }

  return (
    <RecordDialog
      triggerLabel="New class"
      title="New class"
      description="Set up a class, its meeting times, and where it meets."
      submitLabel="Create class"
      onSubmit={submit}
    >
      <div className="grid grid-cols-2 gap-4">
        <RecordField id="class-name" label="Class name">
          <Input id="class-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chemistry" />
        </RecordField>
        <RecordField id="class-code" label="Code">
          <Input id="class-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CHEM-210" />
        </RecordField>
        <RecordField id="class-subject" label="Subject">
          <Input id="class-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Science" />
        </RecordField>
        <RecordField id="class-room" label="Room">
          <Input id="class-room" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Lab 2" />
        </RecordField>
      </div>

      <RecordField id="class-grade" label="Grade">
        <Select items={gradeItems} value={grade} onValueChange={(v) => setGrade(v ?? "Grade 9")}>
          <SelectTrigger id="class-grade" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {gradeItems.map((g) => (
              <SelectItem key={g.value} value={g.value}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </RecordField>

      <RecordField id="class-days" label="Meets on">
        <ToggleGroup
          id="class-days"
          multiple
          variant="outline"
          size="sm"
          aria-label="Meets on"
          className="justify-start"
          value={days}
          onValueChange={(v) => setDays(v as Weekday[])}
        >
          {weekdays.map((d) => (
            <ToggleGroupItem key={d} value={d} className="px-2.5">
              {d}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </RecordField>

      <div className="grid grid-cols-2 gap-4">
        <RecordField id="class-start" label="Starts">
          <Input id="class-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </RecordField>
        <RecordField id="class-end" label="Ends">
          <Input id="class-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </RecordField>
      </div>

      <RecordField id="class-color" label="Color">
        <ToggleGroup
          id="class-color"
          variant="outline"
          size="sm"
          aria-label="Color"
          className="justify-start"
          value={[color]}
          onValueChange={(v) => v[0] && setColor(v[0] as ClassColor)}
        >
          {colors.map((c) => (
            <ToggleGroupItem key={c} value={c} aria-label={c} className="size-8 p-0">
              <span className={`size-4 rounded-full ${swatch[c]}`} aria-hidden />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </RecordField>
    </RecordDialog>
  );
}
