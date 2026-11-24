import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PagePlaceholderSkeleton } from "@/components/dashboard/page-placeholder";
import { SessionDetailView } from "@/components/sessions/session-detail";
import { attendance, getSessionDetail } from "@/lib/data";

// One static page per session.
export function generateStaticParams() {
  return attendance.map((s) => ({ id: s.id }));
}

// Reading `params` happens below a <Suspense> boundary (required with Cache Components).
export default function SessionPage(props: PageProps<"/sessions/[id]">) {
  return (
    <Suspense fallback={<PagePlaceholderSkeleton />}>
      <SessionContent params={props.params} />
    </Suspense>
  );
}

async function SessionContent({ params }: { params: PageProps<"/sessions/[id]">["params"] }) {
  const { id } = await params;
  const detail = getSessionDetail(id);
  if (!detail) notFound();
  return <SessionDetailView detail={detail} />;
}
