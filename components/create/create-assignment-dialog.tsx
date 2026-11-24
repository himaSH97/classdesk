"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { makeAssignment } from "@/lib/create";
import type { AssignmentOverview, AssignmentType, ClassColor } from "@/lib/data";
import { assignmentTypeLabel } from "@/lib/format";
import { RecordDialog, RecordField } from "./record-dialog";

const typeItems = (Object.keys(assignmentTypeLabel) as AssignmentType[]).map((t) => ({ value: t, label: assignmentTypeLabel[t] }));

export function CreateAssignmentDialog({
  classes,
  today,
  onCreate,
}: {
  classes: { id: string; code: string; name: string; color: ClassColor; size: number }[];
  today: string;
  onCreate: (a: AssignmentOverview) => void;
}) {
  const classItems = classes.map((c) => ({ value: c.id, label: `${c.code} · ${c.name}` }));
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState<string>(classes[0]?.id ?? "");
  const [type, setType] = useState<AssignmentType>("homework");
  const [dueDate, setDueDate] = useState("");
  const [maxPoints, setMaxPoints] = useState("20");
  const [description, setDescription] = useState("");

  function submit() {
    if (!title.trim()) return "Give the assignment a title.";
    if (!classId) return "Pick a class.";
    if (!dueDate) return "Pick a due date.";
    if (dueDate < today) return "The due date can't be in the past.";
    const points = Number(maxPoints);
    if (!Number.isFinite(points) || points <= 0) return "Max points must be a positive number.";
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return "Pick a class.";
    onCreate(
      makeAssignment(
        { title, description, classId, type, dueDate, maxPoints: points },
        { today, classSize: cls.size, cls: { id: cls.id, code: cls.code, name: cls.name, color: cls.color } },
      ),
    );
    setTitle("");
    setDescription("");
    setDueDate("");
    return null;
  }

  return (
    <RecordDialog
      triggerLabel="New assignment"
      title="New assignment"
      description="Set a due date and points for one of your classes."
      submitLabel="Create assignment"
      onSubmit={submit}
    >
      <RecordField id="assignment-title" label="Title">
        <Input id="assignment-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 6 problem set" />
      </RecordField>

      <RecordField id="assignment-description" label="Instructions (optional)">
        <Textarea
          id="assignment-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What students should do, and what to hand in"
          className="min-h-20"
        />
      </RecordField>

      <RecordField id="assignment-class" label="Class">
        <Select items={classItems} value={classId} onValueChange={(v) => setClassId(v ?? "")}>
          <SelectTrigger id="assignment-class" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {classItems.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </RecordField>

      <div className="grid grid-cols-2 gap-4">
        <RecordField id="assignment-type" label="Type">
          <Select items={typeItems} value={type} onValueChange={(v) => setType((v ?? "homework") as AssignmentType)}>
            <SelectTrigger id="assignment-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeItems.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </RecordField>
        <RecordField id="assignment-points" label="Max points">
          <Input id="assignment-points" type="number" min={1} value={maxPoints} onChange={(e) => setMaxPoints(e.target.value)} />
        </RecordField>
      </div>

      <RecordField id="assignment-due" label="Due date">
        <Input id="assignment-due" type="date" min={today} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </RecordField>
    </RecordDialog>
  );
}
