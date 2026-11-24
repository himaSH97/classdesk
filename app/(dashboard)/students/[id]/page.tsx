import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PagePlaceholderSkeleton } from "@/components/dashboard/page-placeholder";
import { StudentProfileView } from "@/components/students/student-profile";
import { getStudentProfile, meta, students } from "@/lib/data";

// One static page per student.
export function generateStaticParams() {
  return students.map((s) => ({ id: s.id }));
}

// Reading `params` happens below a <Suspense> boundary (required with Cache Components).
export default function StudentPage(props: PageProps<"/students/[id]">) {
  return (
    <Suspense fallback={<PagePlaceholderSkeleton />}>
      <StudentContent params={props.params} />
    </Suspense>
  );
}

async function StudentContent({ params }: { params: PageProps<"/students/[id]">["params"] }) {
  const { id } = await params;
  const student = getStudentProfile(id);
  if (!student) notFound();
  return <StudentProfileView student={student} today={meta.today} />;
}
