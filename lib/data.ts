// Typed access to the mock JSON in /data. There is no backend: every page reads
// from here, so swapping the JSON for an API later only touches this file.

import assignmentsJson from "@/data/assignments.json";
import attendanceJson from "@/data/attendance.json";
import classesJson from "@/data/classes.json";
import messagesJson from "@/data/messages.json";
import metaJson from "@/data/meta.json";
import { AT_RISK_ATTENDANCE } from "@/lib/constants";
import { assignmentTypeLabel, formatInboxTime } from "@/lib/format";
import studentsJson from "@/data/students.json";

export type ClassStatus = "active" | "upcoming" | "archived";
export type ClassColor = "violet" | "amber" | "sky" | "rose" | "emerald" | "indigo";
export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export type Performance = "strong" | "average" | "weak";
export type AssignmentType = "homework" | "quiz" | "essay" | "lab" | "project" | "exam";
/** Derived from the due date and grading progress, never stored. */
export type AssignmentStatus = "open" | "grading" | "graded";
export type AttendanceStatus = "present" | "late" | "absent" | "excused";

export interface SchoolClass {
  id: string;
  name: string;
  code: string;
  subject: string;
  grade: string;
  room: string;
  color: ClassColor;
  status: ClassStatus;
  schedule: { days: Weekday[]; start: string; end: string };
  /** First meeting, when it differs from the term start (e.g. upcoming classes). */
  startDate?: string;
  /** 0–1, or null when the class hasn't started yet. */
  attendanceRate: number | null;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  classIds: string[];
  performance: Performance;
  /** 0–1 */
  attendanceRate: number;
  /** 0–100 */
  averageScore: number;
  /** ISO date, YYYY-MM-DD */
  lastActive: string;
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  /** Instructions shown to students. */
  description?: string;
  /** Missing means published (the seeded assignments are all published). */
  published?: boolean;
  type: AssignmentType;
  /** ISO date, YYYY-MM-DD */
  assignedDate: string;
  /** ISO date, YYYY-MM-DD */
  dueDate: string;
  maxPoints: number;
  /** Number of students who turned it in. */
  submitted: number;
  /** Number of submissions graded so far. */
  graded: number;
  /** Average of graded submissions as a percentage, or null if none graded. */
  averageScore: number | null;
}

/** One class meeting and every enrolled student's attendance for it. */
export interface AttendanceSession {
  id: string;
  classId: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  records: { studentId: string; status: AttendanceStatus }[];
}

export const classes = classesJson as SchoolClass[];
export const students = studentsJson as Student[];
export const assignments = assignmentsJson as Assignment[];
export const attendance = attendanceJson as AttendanceSession[];

// ---------- attendance rates (single source of truth) ----------
// Rates come from the recorded sessions whenever a class/student has any, so the
// Classes, Students, and Attendance pages always agree. Classes with no sessions
// (archived or not started) fall back to the value stored in the JSON.

function tallyRates(key: (session: AttendanceSession, studentId: string) => string) {
  const tally = new Map<string, { attended: number; total: number }>();
  for (const session of attendance) {
    for (const r of session.records) {
      const k = key(session, r.studentId);
      const entry = tally.get(k) ?? { attended: 0, total: 0 };
      entry.total++;
      if (r.status === "present" || r.status === "late") entry.attended++;
      tally.set(k, entry);
    }
  }
  return new Map([...tally].map(([k, e]) => [k, e.attended / e.total]));
}

const classRates = tallyRates((session) => session.classId);
const studentRates = tallyRates((_, studentId) => studentId);

export function classAttendanceRate(c: SchoolClass): number | null {
  return classRates.get(c.id) ?? c.attendanceRate;
}

export function studentAttendanceRate(s: Student): number {
  return studentRates.get(s.id) ?? s.attendanceRate;
}

export { AT_RISK_ATTENDANCE } from "@/lib/constants";
export { assignmentTypeLabel, relativeDue } from "@/lib/format";

// A fixed "today" keeps the mock data meaningful no matter when the app is viewed.
export const meta = metaJson as { term: string; termStart: string; termEnd: string; today: string };

// ---------- date helpers (UTC, so server and client agree) ----------

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtc(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`);
}

export function daysFromToday(isoDate: string) {
  return Math.round((toUtc(isoDate).getTime() - toUtc(meta.today).getTime()) / DAY_MS);
}

export function formatShortDate(isoDate: string) {
  return toUtc(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** "08:00" -> "8:00 AM" */
function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase();
}

// ---------- classes page ----------

export interface ClassOverview extends SchoolClass {
  daysLabel: string;
  timeLabel: string;
  studentCount: number;
  /** A few students for the avatar stack. */
  studentPreview: { id: string; name: string; initials: string }[];
  nextAssignment: { title: string; dueLabel: string; daysLeft: number } | null;
}

export function getClassOverviews(): ClassOverview[] {
  return classes.map((cls) => {
    const enrolled = students.filter((s) => s.classIds.includes(cls.id));
    const next = assignments
      .filter((a) => a.classId === cls.id && daysFromToday(a.dueDate) >= 0)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

    return {
      ...cls,
      attendanceRate: classAttendanceRate(cls),
      daysLabel: cls.schedule.days.join(", "),
      timeLabel: `${formatTime(cls.schedule.start)} – ${formatTime(cls.schedule.end)}`,
      studentCount: enrolled.length,
      studentPreview: enrolled.slice(0, 3).map((s) => ({ id: s.id, name: s.name, initials: initials(s.name) })),
      nextAssignment: next
        ? { title: next.title, dueLabel: formatShortDate(next.dueDate), daysLeft: daysFromToday(next.dueDate) }
        : null,
    };
  });
}

// ---------- students page ----------

/** "2026-11-23" -> "Yesterday" (relative to meta.today) */
export function formatRelativeDay(isoDate: string) {
  const days = -daysFromToday(isoDate);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatShortDate(isoDate);
}

export interface StudentOverview extends Student {
  initials: string;
  classes: { id: string; code: string; name: string; color: ClassColor }[];
  lastActiveLabel: string;
  daysSinceActive: number;
}

export function getStudentOverviews(): StudentOverview[] {
  const byId = new Map(classes.map((c) => [c.id, c]));
  return students.map((s) => ({
    ...s,
    attendanceRate: studentAttendanceRate(s),
    initials: initials(s.name),
    classes: s.classIds
      .map((id) => byId.get(id))
      .filter((c): c is SchoolClass => Boolean(c))
      .map((c) => ({ id: c.id, code: c.code, name: c.name, color: c.color })),
    lastActiveLabel: formatRelativeDay(s.lastActive),
    daysSinceActive: -daysFromToday(s.lastActive),
  }));
}

export function getStudentStats() {
  const avg = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / (values.length || 1);
  return {
    total: students.length,
    classCount: new Set(students.flatMap((s) => s.classIds)).size,
    avgAttendance: avg(students.map(studentAttendanceRate)),
    avgScore: avg(students.map((s) => s.averageScore)),
    needsAttention: students.filter((s) => s.performance === "weak").length,
  };
}

/** Options for a "filter by class" control. */
export function getClassOptions() {
  return classes.map((c) => ({ id: c.id, label: `${c.code} · ${c.name}` }));
}

export function getClassStats() {
  const active = classes.filter((c) => c.status === "active");
  const activeIds = new Set(active.map((c) => c.id));
  const enrolled = students.filter((s) => s.classIds.some((id) => activeIds.has(id)));
  const rates = active.map(classAttendanceRate).filter((r): r is number => r !== null);
  const dueThisWeek = assignments.filter((a) => {
    const d = daysFromToday(a.dueDate);
    return d >= 0 && d <= 7;
  });

  return {
    activeClasses: active.length,
    totalClasses: classes.length,
    activeStudents: enrolled.length,
    avgAttendance: rates.length ? rates.reduce((sum, r) => sum + r, 0) / rates.length : 0,
    dueThisWeek: dueThisWeek.length,
  };
}

// ---------- shared ----------

function classSize(classId: string) {
  return students.filter((s) => s.classIds.includes(classId)).length;
}

function classInfo(classId: string) {
  const c = classes.find((x) => x.id === classId);
  if (!c) throw new Error(`Unknown class ${classId}`);
  return { id: c.id, code: c.code, name: c.name, color: c.color, status: c.status, schedule: c.schedule };
}


// ---------- assignments page ----------


export interface AssignmentOverview extends Assignment {
  /** Drafts can still be edited; once published, the text is locked. */
  published: boolean;
  description: string;
  status: AssignmentStatus;
  class: { id: string; code: string; name: string; color: ClassColor };
  classSize: number;
  /** 0–1 share of the class that submitted. */
  submissionRate: number;
  /** Submissions still waiting to be graded. */
  toGrade: number;
  daysLeft: number;
  dueLabel: string;
}

export function assignmentStatus(a: Assignment): AssignmentStatus {
  if (daysFromToday(a.dueDate) >= 0) return "open";
  return a.graded < a.submitted ? "grading" : "graded";
}

export function getAssignmentOverviews(): AssignmentOverview[] {
  return assignments
    .map((a) => {
      const size = classSize(a.classId);
      const { id, code, name, color } = classInfo(a.classId);
      return {
        ...a,
        published: a.published ?? true,
        description: a.description ?? "",
        status: assignmentStatus(a),
        class: { id, code, name, color },
        classSize: size,
        submissionRate: size ? a.submitted / size : 0,
        toGrade: a.submitted - a.graded,
        daysLeft: daysFromToday(a.dueDate),
        dueLabel: formatShortDate(a.dueDate),
      };
    })
    // Soonest due first; past work after, most recent first.
    .sort((a, b) => {
      const aOpen = a.daysLeft >= 0, bOpen = b.daysLeft >= 0;
      if (aOpen !== bOpen) return aOpen ? -1 : 1;
      return aOpen ? a.daysLeft - b.daysLeft : b.daysLeft - a.daysLeft;
    });
}

export function getAssignmentStats() {
  const rows = getAssignmentOverviews();
  const closed = rows.filter((r) => r.status !== "open");
  return {
    open: rows.filter((r) => r.status === "open").length,
    dueThisWeek: rows.filter((r) => r.daysLeft >= 0 && r.daysLeft <= 7).length,
    toGrade: rows.reduce((sum, r) => sum + r.toGrade, 0),
    toGradeAssignments: rows.filter((r) => r.toGrade > 0).length,
    /** Average share of the class that turned in work, for assignments past due. */
    submissionRate: closed.reduce((sum, r) => sum + r.submissionRate, 0) / (closed.length || 1),
  };
}

// ---------- attendance page ----------

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface SessionOverview {
  id: string;
  date: string;
  weekday: string;
  month: string;
  day: number;
  dateLabel: string;
  /** "Today", "Yesterday", "3 days ago", or the date. */
  relativeLabel: string;
  /** 0 = today, 1 = yesterday, ... (relative to meta.today) */
  daysAgo: number;
  timeLabel: string;
  class: { id: string; code: string; name: string; color: ClassColor };
  counts: Record<AttendanceStatus, number>;
  total: number;
  /** 0–1: present + late over everyone enrolled. */
  rate: number;
  absentees: { id: string; name: string; initials: string; status: "absent" | "excused" }[];
}

export function getSessionOverviews(): SessionOverview[] {
  const studentById = new Map(students.map((s) => [s.id, s]));
  return attendance
    .map((session) => {
      const c = classInfo(session.classId);
      const d = toUtc(session.date);
      const counts: Record<AttendanceStatus, number> = { present: 0, late: 0, absent: 0, excused: 0 };
      for (const r of session.records) counts[r.status]++;
      const total = session.records.length;
      return {
        id: session.id,
        date: session.date,
        weekday: WEEKDAYS[d.getUTCDay()],
        month: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
        day: d.getUTCDate(),
        dateLabel: `${WEEKDAYS[d.getUTCDay()]}, ${formatShortDate(session.date)}`,
        relativeLabel: formatRelativeDay(session.date),
        daysAgo: -daysFromToday(session.date),
        timeLabel: `${formatTime(c.schedule.start)} – ${formatTime(c.schedule.end)}`,
        class: { id: c.id, code: c.code, name: c.name, color: c.color },
        counts,
        total,
        rate: total ? (counts.present + counts.late) / total : 0,
        absentees: session.records
          .filter((r) => r.status === "absent" || r.status === "excused")
          .map((r) => {
            const s = studentById.get(r.studentId);
            const name = s?.name ?? r.studentId;
            return { id: r.studentId, name, initials: initials(name), status: r.status as "absent" | "excused" };
          }),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.timeLabel.localeCompare(b.timeLabel));
}

export function getAttendanceStats() {
  const recent = attendance.filter((s) => daysFromToday(s.date) >= -6);
  const recentRecords = recent.flatMap((s) => s.records);
  const count = (status: AttendanceStatus) => recentRecords.filter((r) => r.status === status).length;

  const atRisk = students.filter((s) => studentAttendanceRate(s) < AT_RISK_ATTENDANCE).length;

  return {
    sessionsThisWeek: recent.length,
    rate: recentRecords.length ? (count("present") + count("late")) / recentRecords.length : 0,
    absences: count("absent") + count("excused"),
    unexcused: count("absent"),
    late: count("late"),
    atRisk,
  };
}

// ---------- calendar page ----------

export type CalendarEventKind = "class" | "due";

export interface CalendarEvent {
  id: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  kind: CalendarEventKind;
  title: string;
  /** Second line, e.g. "8:00 AM – 9:15 AM" or "MATH-302 · Quiz". */
  detail: string;
  /** Orders events within a day (class start time; due dates sort last). */
  sortKey: string;
  classId: string;
  classCode: string;
  className: string;
  color: ClassColor;
  /** Class meetings that already have recorded attendance. */
  attendance?: { attended: number; absent: number; excused: number; total: number };
  /** Due dates only. */
  assignmentType?: AssignmentType;
  assignmentStatus?: AssignmentStatus;
}

function addDays(isoDate: string, n: number) {
  const d = toUtc(isoDate);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Every class meeting and due date in the current term. */
export function getCalendarEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const sessionByKey = new Map(attendance.map((s) => [`${s.classId}|${s.date}`, s]));

  for (const c of classes) {
    if (c.status === "archived") continue; // not meeting this term
    const first = c.startDate && c.startDate > meta.termStart ? c.startDate : meta.termStart;
    for (let date = first; date <= meta.termEnd; date = addDays(date, 1)) {
      const weekday = WEEKDAYS[toUtc(date).getUTCDay()] as Weekday;
      if (!c.schedule.days.includes(weekday)) continue;
      const session = sessionByKey.get(`${c.id}|${date}`);
      let summary: CalendarEvent["attendance"];
      if (session) {
        const count = (st: AttendanceStatus) => session.records.filter((r) => r.status === st).length;
        summary = {
          attended: count("present") + count("late"),
          absent: count("absent"),
          excused: count("excused"),
          total: session.records.length,
        };
      }
      events.push({
        id: `class-${c.id}-${date}`,
        date,
        kind: "class",
        title: c.name,
        detail: `${formatTime(c.schedule.start)} – ${formatTime(c.schedule.end)}`,
        sortKey: c.schedule.start,
        classId: c.id,
        classCode: c.code,
        className: c.name,
        color: c.color,
        attendance: summary,
      });
    }
  }

  for (const a of assignments) {
    if (a.dueDate < meta.termStart || a.dueDate > meta.termEnd) continue;
    const c = classInfo(a.classId);
    events.push({
      id: `due-${a.id}`,
      date: a.dueDate,
      kind: "due",
      title: a.title,
      detail: `${c.code} · ${assignmentTypeLabel[a.type]}`,
      sortKey: "99:99",
      classId: c.id,
      classCode: c.code,
      className: c.name,
      color: c.color,
      assignmentType: a.type,
      assignmentStatus: assignmentStatus(a),
    });
  }

  return events.sort((x, y) => x.date.localeCompare(y.date) || x.sortKey.localeCompare(y.sortKey));
}

/** Months of the current term as "YYYY-MM". */
export function getTermMonths() {
  const months: string[] = [];
  for (let m = meta.termStart.slice(0, 7); m <= meta.termEnd.slice(0, 7); ) {
    months.push(m);
    const [y, mo] = m.split("-").map(Number);
    m = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
  }
  return months;
}

// ---------- messages page ----------

export interface Message {
  id: string;
  from: "teacher" | "student";
  /** "YYYY-MM-DDTHH:mm", school-local time */
  sentAt: string;
  text: string;
}

export interface Conversation {
  id: string;
  studentId: string;
  /** Student messages the teacher hasn't read yet. */
  unread: number;
  messages: Message[];
}

export interface ConversationOverview extends Conversation {
  student: { id: string; name: string; initials: string; grade: string; classCodes: string[] };
}

export const conversations = messagesJson as Conversation[];

export function getConversations(): ConversationOverview[] {
  return conversations.map((c) => {
    const s = students.find((x) => x.id === c.studentId);
    if (!s) throw new Error(`Unknown student ${c.studentId}`);
    return {
      ...c,
      student: {
        id: s.id,
        name: s.name,
        initials: initials(s.name),
        grade: s.grade,
        classCodes: s.classIds.map((id) => classInfo(id).code),
      },
    };
  });
}

// ---------- student page + switcher ----------

/** Lightweight list for the "Select student" switcher. */
export function getStudentDirectory() {
  return {
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      initials: initials(s.name),
      grade: s.grade,
      performance: s.performance,
      classIds: s.classIds,
    })),
    classes: classes.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      color: c.color,
      status: c.status,
      studentCount: students.filter((s) => s.classIds.includes(c.id)).length,
    })),
    sessions: getSessionOverviews().map((s) => ({ id: s.id, label: `${s.class.code} · ${s.dateLabel}` })),
  };
}

export type StudentDirectory = ReturnType<typeof getStudentDirectory>;

export type ActivityKind = AttendanceStatus | "due" | "message";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  color: ClassColor | null;
  /** "HH:mm" for ordering within the day. */
  time: string;
}

export interface StudentProfile extends StudentOverview {
  stats: { attendanceRate: number; sessions: number; absences: number; unexcused: number; late: number };
  counts: Record<AttendanceStatus, number>;
  classDetails: {
    id: string;
    code: string;
    name: string;
    color: ClassColor;
    status: ClassStatus;
    scheduleLabel: string;
    /** This student's attendance in this class, or null if no sessions recorded. */
    attendanceRate: number | null;
    nextDue: { title: string; dueLabel: string; daysLeft: number } | null;
  }[];
  /** Newest day first, from the first recorded session through today. */
  activity: { date: string; weekday: string; label: string; items: ActivityItem[] }[];
  /** The teacher's conversation with this student (empty if they haven't talked yet). */
  conversation: ConversationOverview;
}

export function getStudentProfile(id: string): StudentProfile | null {
  const overview = getStudentOverviews().find((s) => s.id === id);
  if (!overview) return null;

  const mine = attendance
    .map((session) => ({ session, record: session.records.find((r) => r.studentId === id) }))
    .filter((x): x is { session: AttendanceSession; record: AttendanceSession["records"][number] } => Boolean(x.record));

  const counts: Record<AttendanceStatus, number> = { present: 0, late: 0, absent: 0, excused: 0 };
  for (const { record } of mine) counts[record.status]++;

  const classDetails = overview.classIds.map((classId) => {
    const c = classes.find((x) => x.id === classId)!;
    const inClass = mine.filter((m) => m.session.classId === classId);
    const attended = inClass.filter((m) => m.record.status === "present" || m.record.status === "late").length;
    const next = assignments
      .filter((a) => a.classId === classId && daysFromToday(a.dueDate) >= 0)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      color: c.color,
      status: c.status,
      scheduleLabel: `${c.schedule.days.join(", ")} · ${formatTime(c.schedule.start)}`,
      attendanceRate: inClass.length ? attended / inClass.length : null,
      nextDue: next
        ? { title: next.title, dueLabel: formatShortDate(next.dueDate), daysLeft: daysFromToday(next.dueDate) }
        : null,
    };
  });

  // Activity: attendance per session, due dates in their classes, messages they sent.
  const start = attendance.reduce((min, s) => (s.date < min ? s.date : min), meta.today);
  const byDate = new Map<string, ActivityItem[]>();
  const push = (date: string, item: ActivityItem) => byDate.set(date, [...(byDate.get(date) ?? []), item]);
  const statusTitle: Record<AttendanceStatus, string> = {
    present: "Present",
    late: "Arrived late",
    absent: "Absent",
    excused: "Excused absence",
  };

  for (const { session, record } of mine) {
    const c = classes.find((x) => x.id === session.classId)!;
    push(session.date, {
      id: `att-${session.id}`,
      kind: record.status,
      title: statusTitle[record.status],
      detail: `${c.name} · ${formatTime(c.schedule.start)}`,
      color: c.color,
      time: c.schedule.start,
    });
  }
  for (const a of assignments) {
    if (!overview.classIds.includes(a.classId) || a.dueDate < start || a.dueDate > meta.today) continue;
    const c = classes.find((x) => x.id === a.classId)!;
    push(a.dueDate, {
      id: `due-${a.id}`,
      kind: "due",
      title: `Due: ${a.title}`,
      detail: `${c.code} · ${assignmentTypeLabel[a.type]}`,
      color: c.color,
      time: "23:59",
    });
  }
  for (const conv of conversations.filter((c) => c.studentId === id)) {
    for (const m of conv.messages) {
      const date = m.sentAt.slice(0, 10);
      if (m.from !== "student" || date < start || date > meta.today) continue;
      push(date, {
        id: `msg-${m.id}`,
        kind: "message",
        title: "Messaged you",
        detail: m.text.length > 48 ? `${m.text.slice(0, 47)}…` : m.text,
        color: null,
        time: m.sentAt.slice(11, 16),
      });
    }
  }

  const activity: StudentProfile["activity"] = [];
  for (let date = meta.today; date >= start; date = addDays(date, -1)) {
    activity.push({
      date,
      weekday: WEEKDAYS[toUtc(date).getUTCDay()],
      label: formatRelativeDay(date),
      items: (byDate.get(date) ?? []).sort((a, b) => a.time.localeCompare(b.time)),
    });
  }

  const conversation: ConversationOverview = getConversations().find((c) => c.studentId === id) ?? {
    id: `conv-${id}`,
    studentId: id,
    unread: 0,
    messages: [],
    student: {
      id,
      name: overview.name,
      initials: overview.initials,
      grade: overview.grade,
      classCodes: overview.classes.map((c) => c.code),
    },
  };

  return {
    ...overview,
    conversation,
    stats: {
      attendanceRate: overview.attendanceRate,
      sessions: mine.length,
      absences: counts.absent + counts.excused,
      unexcused: counts.absent,
      late: counts.late,
    },
    counts,
    classDetails,
    activity,
  };
}

// ---------- class page ----------

export interface ClassRosterEntry {
  id: string;
  name: string;
  initials: string;
  grade: string;
  performance: Performance;
  averageScore: number;
  /** This student's attendance in this class, or null if no sessions yet. */
  attendanceRate: number | null;
  absences: number;
}

export interface ClassProfile {
  id: string;
  code: string;
  name: string;
  subject: string;
  grade: string;
  room: string;
  color: ClassColor;
  status: ClassStatus;
  scheduleLabel: string;
  startLabel: string | null;
  studentCount: number;
  /** Class attendance over every recorded session, or null before the first one. */
  attendanceRate: number | null;
  sessionCount: number;
  averageScore: number | null;
  atRiskCount: number;
  openAssignments: number;
  toGrade: number;
  roster: ClassRosterEntry[];
  assignments: AssignmentOverview[];
  sessions: SessionOverview[];
}

export function getClassProfile(id: string): ClassProfile | null {
  const cls = classes.find((c) => c.id === id);
  if (!cls) return null;

  const classSessions = attendance.filter((s) => s.classId === id);
  const sessionOverviews = getSessionOverviews().filter((s) => s.class.id === id);
  const assignmentRows = getAssignmentOverviews().filter((a) => a.classId === id);
  const enrolled = students.filter((s) => s.classIds.includes(id));

  const roster: ClassRosterEntry[] = enrolled
    .map((s) => {
      const records = classSessions.flatMap((session) => session.records.filter((r) => r.studentId === s.id));
      const attended = records.filter((r) => r.status === "present" || r.status === "late").length;
      return {
        id: s.id,
        name: s.name,
        initials: initials(s.name),
        grade: s.grade,
        performance: s.performance,
        averageScore: s.averageScore,
        attendanceRate: records.length ? attended / records.length : null,
        absences: records.filter((r) => r.status === "absent").length,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const allRecords = classSessions.flatMap((s) => s.records);
  const attendedAll = allRecords.filter((r) => r.status === "present" || r.status === "late").length;
  const scored = enrolled.map((s) => s.averageScore);

  const startLabel = cls.startDate && cls.startDate > meta.today ? formatShortDate(cls.startDate) : null;

  return {
    id: cls.id,
    code: cls.code,
    name: cls.name,
    subject: cls.subject,
    grade: cls.grade,
    room: cls.room,
    color: cls.color,
    status: cls.status,
    scheduleLabel: `${cls.schedule.days.join(", ")} · ${formatTime(cls.schedule.start)} – ${formatTime(cls.schedule.end)}`,
    startLabel,
    studentCount: enrolled.length,
    attendanceRate: allRecords.length ? attendedAll / allRecords.length : null,
    sessionCount: classSessions.length,
    averageScore: scored.length ? scored.reduce((sum, v) => sum + v, 0) / scored.length : null,
    atRiskCount: roster.filter((r) => r.attendanceRate !== null && r.attendanceRate < AT_RISK_ATTENDANCE).length,
    openAssignments: assignmentRows.filter((a) => a.status === "open").length,
    toGrade: assignmentRows.reduce((sum, a) => sum + a.toGrade, 0),
    roster,
    assignments: assignmentRows,
    sessions: sessionOverviews,
  };
}

// ---------- attendance session page ----------

export function getSessionDetail(id: string) {
  const overview = getSessionOverviews().find((s) => s.id === id);
  const session = attendance.find((s) => s.id === id);
  if (!overview || !session) return null;
  const cls = classes.find((c) => c.id === session.classId);
  if (!cls) return null;

  const order: AttendanceStatus[] = ["absent", "excused", "late", "present"];
  const roster = session.records
    .map((r) => {
      const s = students.find((x) => x.id === r.studentId);
      return {
        id: r.studentId,
        name: s?.name ?? r.studentId,
        initials: initials(s?.name ?? r.studentId),
        grade: s?.grade ?? "",
        status: r.status,
      };
    })
    .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || a.name.localeCompare(b.name));

  return {
    ...overview,
    classId: cls.id,
    room: cls.room,
    scheduleLabel: `${cls.schedule.days.join(", ")} · ${formatTime(cls.schedule.start)} – ${formatTime(cls.schedule.end)}`,
    roster,
  };
}

export type SessionDetail = NonNullable<ReturnType<typeof getSessionDetail>>;

// ---------- overview (home) ----------

export function getOverview() {
  const today = meta.today;
  const weekday = WEEKDAYS[toUtc(today).getUTCDay()] as Weekday;

  const todayClasses = classes
    .filter((c) => c.status === "active" && c.schedule.days.includes(weekday))
    .sort((a, b) => a.schedule.start.localeCompare(b.schedule.start))
    .map((c) => {
      const session = attendance.find((s) => s.classId === c.id && s.date === today);
      const records = session?.records ?? [];
      const absent = records.filter((r) => r.status === "absent" || r.status === "excused").length;
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        color: c.color,
        room: c.room,
        startLabel: formatTime(c.schedule.start),
        timeLabel: `${formatTime(c.schedule.start)} – ${formatTime(c.schedule.end)}`,
        sessionId: session?.id ?? null,
        total: records.length,
        present: records.filter((r) => r.status === "present" || r.status === "late").length,
        absent,
      };
    });

  const attention = getStudentOverviews()
    .filter((s) => s.performance === "weak" || s.attendanceRate < AT_RISK_ATTENDANCE)
    .sort((a, b) => a.attendanceRate - b.attendanceRate);

  const threads = getConversations()
    .map((c) => ({ c, last: c.messages.at(-1) }))
    .filter((x): x is { c: ConversationOverview; last: Message } => Boolean(x.last))
    .sort((a, b) => b.last.sentAt.localeCompare(a.last.sentAt))
    .slice(0, 4)
    .map(({ c, last }) => ({
      id: c.id,
      unread: c.unread,
      studentId: c.student.id,
      name: c.student.name,
      initials: c.student.initials,
      fromTeacher: last.from === "teacher",
      preview: last.text,
      timeLabel: formatInboxTime(last.sentAt, today),
    }));

  const dueSoon = getAssignmentOverviews()
    .filter((a) => a.status === "open")
    .slice(0, 5);

  const unreadTotal = conversations.reduce((n, c) => n + c.unread, 0);

  return {
    dateHeading: toUtc(today).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }),
    term: meta.term,
    todayClasses,
    dueSoon,
    dueThisWeek: getAssignmentStats().dueThisWeek,
    attention,
    threads,
    unreadTotal,
  };
}

export type Overview = ReturnType<typeof getOverview>;

// ---------- analytics ----------

export function getAnalytics() {
  // Oldest session first, so the trend reads left to right.
  const trend = getSessionOverviews()
    .slice()
    .reverse()
    .map((s) => ({ label: String(s.day), title: `${s.dateLabel} · ${s.class.code}: ${pct0(s.rate)}`, value: s.rate }));

  const byClass = getClassOverviews()
    .filter((c) => c.status !== "archived" && c.attendanceRate !== null)
    .map((c) => {
      const enrolled = students.filter((s) => s.classIds.includes(c.id));
      const score = enrolled.reduce((n, s) => n + s.averageScore, 0) / (enrolled.length || 1);
      return { id: c.id, code: c.code, name: c.name, color: c.color, attendance: c.attendanceRate!, score };
    });

  const performance = (["strong", "average", "weak"] as Performance[]).map((p) => ({
    key: p,
    count: students.filter((s) => s.performance === p).length,
  }));

  const types = (Object.keys(assignmentTypeLabel) as AssignmentType[])
    .map((t) => {
      const rows = getAssignmentOverviews().filter((a) => a.type === t && a.submitted > 0);
      const scored = rows.filter((a) => a.averageScore !== null);
      return {
        type: t,
        label: assignmentTypeLabel[t],
        count: rows.length,
        submissionRate: rows.reduce((n, a) => n + a.submissionRate, 0) / (rows.length || 1),
        score: scored.length ? scored.reduce((n, a) => n + a.averageScore!, 0) / scored.length : null,
      };
    })
    .filter((t) => t.count > 0);

  const stats = getStudentStats();
  const assignmentStats = getAssignmentStats();

  return {
    term: meta.term,
    dateHeading: toUtc(meta.today).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" }),
    sessionCount: attendance.length,
    studentCount: students.length,
    avgAttendance: stats.avgAttendance,
    avgScore: stats.avgScore,
    submissionRate: assignmentStats.submissionRate,
    atRisk: getStudentOverviews().filter((s) => s.attendanceRate < AT_RISK_ATTENDANCE).length,
    trend,
    byClass,
    performance,
    types,
  };
}

const pct0 = (n: number) => `${Math.round(n * 100)}%`;

// ---------- reports (flat rows for CSV export) ----------

export function getReportRows() {
  return {
    roster: getStudentOverviews().map((s) => ({
      name: s.name,
      email: s.email,
      grade: s.grade,
      classes: s.classes.map((c) => c.code).join("; "),
      performance: s.performance,
      attendance: Math.round(s.attendanceRate * 100),
      averageScore: s.averageScore,
      lastActive: s.lastActive,
    })),
    sessions: getSessionOverviews().map((s) => ({
      date: s.date,
      class: s.class.code,
      present: s.counts.present,
      late: s.counts.late,
      absent: s.counts.absent,
      excused: s.counts.excused,
      attendance: Math.round(s.rate * 100),
    })),
    assignments: getAssignmentOverviews().map((a) => ({
      title: a.title,
      class: a.class.code,
      type: assignmentTypeLabel[a.type],
      dueDate: a.dueDate,
      maxPoints: a.maxPoints,
      submitted: a.submitted,
      classSize: a.classSize,
      graded: a.graded,
      averageScore: a.averageScore ?? "",
    })),
  };
}
