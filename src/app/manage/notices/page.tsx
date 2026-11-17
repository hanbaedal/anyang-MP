import { PageHero } from "@/components/page-hero";
import { ManageNotices } from "@/components/manage-notices";
import { listNotices } from "@/lib/notices";
import { getNoticesPageSettings } from "@/lib/notices-page";

export default async function ManageNoticesPage() {
  const [items, page] = await Promise.all([listNotices(), getNoticesPageSettings()]);
  return (
    <>
      <PageHero
        kicker="관리"
        title="공지사항"
        lead="등록한 글이 이용안내 공지 목록에 올라갑니다. 본문에는 글만 표시되며, 상단 배너 배경만 별도로 지정할 수 있습니다."
      />
      <ManageNotices initial={items} initialPage={page} />
    </>
  );
}
