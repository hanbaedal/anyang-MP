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
        lead="등록한 글이 공원소개 공지 목록에 올라갑니다. 목록 좌측 큰 사진은 갤러리에서 한 장만 연결합니다(글별 썸네일 없음)."
      />
      <ManageNotices initial={items} initialPage={page} />
    </>
  );
}
