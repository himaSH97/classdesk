import {
  FileText,
  FlaskConical,
  GraduationCap,
  Layers,
  ListChecks,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import type { AssignmentType } from "@/lib/data";

/** One icon per assignment type, shared by the Assignments list and Calendar. */
export const assignmentTypeIcon: Record<AssignmentType, LucideIcon> = {
  homework: PenLine,
  quiz: ListChecks,
  essay: FileText,
  lab: FlaskConical,
  project: Layers,
  exam: GraduationCap,
};
