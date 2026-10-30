import { PageHero } from "@/components/page-hero";
import { ManageNotices } from "@/components/manage-notices";
import { listNotices } from "@/lib/notices";

export default async function ManageNoticesPage() {
  const items = await listNotices();
  return (
    <>
      <PageHero kicker="관리" title="공지사항" lead="등록한 글이 공원소개 공지 목록에 올라갑니다." />
      <ManageNotices initial={items} />
    </>
  );
}
