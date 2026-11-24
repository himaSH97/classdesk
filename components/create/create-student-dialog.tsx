"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { makeStudent } from "@/lib/create";
import type { ClassColor, StudentOverview } from "@/lib/data";
import { RecordDialog, RecordField } from "./record-dialog";

const gradeItems = ["Grade 9", "Grade 10", "Grade 11", "Grade 12"].map((g) => ({ value: g, label: g }));

export function CreateStudentDialog({
  classes,
  today,
  onCreate,
}: {
  classes: { id: string; code: string; name: string; color: ClassColor }[];
  today: string;
  onCreate: (s: StudentOverview) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState("Grade 9");
  const [classIds, setClassIds] = useState<string[]>([]);

  function submit() {
    if (!name.trim()) return "Enter the student's name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Enter a valid school email.";
    if (classIds.length === 0) return "Enrol the student in at least one class.";
    onCreate(makeStudent({ name, email, grade, classIds }, classes, today));
    setName("");
    setEmail("");
    setClassIds([]);
    return null;
  }

  return (
    <RecordDialog
      triggerLabel="New student"
      title="New student"
      description="Add a student and enrol them in their classes."
      submitLabel="Add student"
      onSubmit={submit}
    >
      <RecordField id="student-name" label="Full name">
        <Input id="student-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maya Patel" autoComplete="off" />
      </RecordField>

      <RecordField id="student-email" label="School email">
        <Input
          id="student-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@school.edu"
          autoComplete="off"
        />
      </RecordField>

      <RecordField id="student-grade" label="Grade">
        <Select items={gradeItems} value={grade} onValueChange={(v) => setGrade(v ?? "Grade 9")}>
          <SelectTrigger id="student-grade" className="w-full">
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

      <RecordField id="student-classes" label="Classes">
        <ToggleGroup
          id="student-classes"
          multiple
          variant="outline"
          size="sm"
          aria-label="Classes"
          className="flex-wrap justify-start"
          value={classIds}
          onValueChange={setClassIds}
        >
          {classes.map((c) => (
            <ToggleGroupItem key={c.id} value={c.id} className="px-2.5">
              {c.code}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </RecordField>
    </RecordDialog>
  );
}
