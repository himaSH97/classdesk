"use client";

import { useState } from "react";
import { CircleCheck, Lock } from "lucide-react";
import { RecordField } from "@/components/create/record-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { dueFields, shortDate } from "@/lib/create";
import type { AssignmentOverview, AssignmentStatus, AssignmentType } from "@/lib/data";
import { assignmentTypeLabel, relativeDue } from "@/lib/format";
import { classColorTile, tone } from "@/lib/styles";
import { cn } from "@/lib/utils";

const typeItems = (Object.keys(assignmentTypeLabel) as AssignmentType[]).map((t) => ({ value: t, label: assignmentTypeLabel[t] }));

const statusStyle: Record<AssignmentStatus, { label: string; className: string }> = {
  open: { label: "Open", className: tone.info },
  grading: { label: "Needs grading", className: tone.warning },
  graded: { label: "Graded", className: tone.positive },
};

/** Badge for an assignment: Draft until published, then its grading status. */
export function assignmentBadge(row: Pick<AssignmentOverview, "published" | "status">) {
  if (!row.published) return { label: "Draft", className: tone.neutral };
  return statusStyle[row.status];
}

/**
 * Assignment details in a right-hand sheet. Drafts are editable and can be published.
 * Publishing asks for confirmation and locks the text: afterwards nothing can be
 * edited, only grading and submissions move forward.
 */
export function AssignmentSheet({
  row,
  today,
  onClose,
  onUpdate,
}: {
  row: AssignmentOverview | null;
  today: string;
  onClose: () => void;
  onUpdate: (patch: Partial<AssignmentOverview>) => void;
}) {
  return (
    <Sheet open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        {row && <AssignmentBody key={row.id} row={row} today={today} onUpdate={onUpdate} />}
      </SheetContent>
    </Sheet>
  );
}

function AssignmentBody({
  row,
  today,
  onUpdate,
}: {
  row: AssignmentOverview;
  today: string;
  onUpdate: (patch: Partial<AssignmentOverview>) => void;
}) {
  const [title, setTitle] = useState(row.title);
  const [description, setDescription] = useState(row.description);
  const [type, setType] = useState<AssignmentType>(row.type);
  const [dueDate, setDueDate] = useState(row.dueDate);
  const [maxPoints, setMaxPoints] = useState(String(row.maxPoints));
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const badge = assignmentBadge(row);

  /** The edited values as a patch, or the first validation message. */
  function collect(): Partial<AssignmentOverview> | string {
    if (!title.trim()) return "Give the assignment a title.";
    if (!dueDate) return "Pick a due date.";
    const points = Number(maxPoints);
    if (!(points > 0)) return "Max points must be a positive number.";
    return { title: title.trim(), description: description.trim(), type, maxPoints: points, ...dueFields(dueDate, today) };
  }

  function save() {
    const patch = collect();
    if (typeof patch === "string") return setError(patch);
    setError(null);
    onUpdate(patch);
  }

  function publish() {
    const patch = collect();
    if (typeof patch === "string") {
      setConfirmOpen(false);
      return setError(patch);
    }
    if (patch.dueDate! < today) {
      setConfirmOpen(false);
      return setError("The due date can't be in the past.");
    }
    setError(null);
    setConfirmOpen(false);
    onUpdate({ ...patch, published: true });
  }

  const submitted = row.submitted;
  const classSize = row.classSize;

  return (
    <>
      <SheetHeader className="gap-2 border-b p-5 pr-12">
        <div className="flex items-center gap-2">
          <Badge variant="ghost" className={badge.className}>
            {badge.label}
          </Badge>
          {row.published && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="size-3" aria-hidden />
              Text locked
            </span>
          )}
        </div>
        <SheetTitle className="text-xl leading-snug">{row.title}</SheetTitle>
        <SheetDescription className="flex items-center gap-2">
          <span className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-md text-2xs font-semibold", classColorTile[row.class.color])} aria-hidden>
            {row.class.code.split("-")[1]}
          </span>
          {row.class.code} · {row.class.name}
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-5">
        {row.published ? (
          <section className="flex flex-col gap-4">
            <p className="text-sm whitespace-pre-wrap">{row.description || "No instructions were added."}</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <Detail label="Type" value={assignmentTypeLabel[row.type]} />
              <Detail label="Max points" value={String(row.maxPoints)} />
              <Detail label="Due" value={`${row.dueLabel} · ${relativeDue(row.daysLeft)}`} />
              <Detail label="Assigned" value={shortDate(row.assignedDate)} />
            </dl>
          </section>
        ) : (
          <section className="flex flex-col gap-4">
            <p className="rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              Draft. Students can&apos;t see this yet. Publish to lock the text.
            </p>
            <RecordField id="detail-title" label="Title">
              <Input id="detail-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </RecordField>
            <RecordField id="detail-description" label="Instructions">
              <Textarea id="detail-description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-24" placeholder="What students should do, and what to hand in" />
            </RecordField>
            <div className="grid grid-cols-2 gap-4">
              <RecordField id="detail-type" label="Type">
                <Select items={typeItems} value={type} onValueChange={(v) => setType((v ?? "homework") as AssignmentType)}>
                  <SelectTrigger id="detail-type" className="w-full">
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
              <RecordField id="detail-points" label="Max points">
                <Input id="detail-points" type="number" min={1} value={maxPoints} onChange={(e) => setMaxPoints(e.target.value)} />
              </RecordField>
            </div>
            <RecordField id="detail-due" label="Due date">
              <Input id="detail-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </RecordField>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </section>
        )}

        <section className="flex flex-col gap-3 border-t pt-5">
          <p className="text-sm font-medium">Progress</p>
          {row.published ? (
            <>
              <div className="flex items-center gap-3">
                <Progress value={Math.round(row.submissionRate * 100)} aria-label="Submissions" className="flex-1" />
                <span className="text-sm tabular-nums">
                  {submitted}/{classSize} submitted
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Detail label="Graded" value={`${row.graded} of ${submitted}`} />
                <Detail label="To grade" value={String(row.toGrade)} />
                <Detail label="Average" value={row.averageScore === null ? "—" : `${row.averageScore}%`} />
                <Detail label="Class size" value={String(classSize)} />
              </dl>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Submissions open once the assignment is published.</p>
          )}
        </section>
      </div>

      {/* Drafts get Save / Publish. Once published there's nothing to act on (the X closes it). */}
      {!row.published && (
        <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
          <Button variant="outline" className="rounded-xl" onClick={save}>
            Save draft
          </Button>
          <Button className="rounded-xl" onClick={() => setConfirmOpen(true)}>
            <CircleCheck />
            Publish
          </Button>
        </SheetFooter>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish this assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              Students in {row.class.code} will see it right away. Its title, instructions, points, and due date
              will be locked and can&apos;t be changed afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep editing</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl" onClick={publish}>
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium tabular-nums">{value}</dd>
    </div>
  );
}
