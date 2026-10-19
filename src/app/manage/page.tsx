import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { ManageI18nMigrate } from "@/components/manage-i18n-migrate";
import { CMS_SLUGS } from "@/lib/cms-types";
import { listInquiries } from "@/lib/inquiries";
import { requireCmsStaff } from "@/lib/auth";
import { manageNavItems } from "@/lib/manage-nav";

const CARD_COPY: Record<string, { title: string; lead: string }> = {
  "manage.homeHero": {
    title: "메인 영상·음악",
    lead: "메인 배경 동영상·BGM을 올리거나 목록에서 골라 공개합니다.",
  },
  "manage.announcements": {
    title: "메인 이벤트·팝업",
    lead: "메인 접속 시 포스터·소식 모달. 기간·끄기·닫기 설정.",
  },
  "manage.gallery": {
    title: "갤러리 사진",
    lead: "일반·종류별 사진을 올립니다. 「일반」은 공개 갤러리와 메인 팝업 등 홈페이지 관리에서 고를 수 있습니다.",
  },
  "manage.notices": {
    title: "공지사항",
    lead: "글을 등록·수정·삭제합니다.",
  },
  "manage.inquiries": {
    title: "문의 목록",
    lead: "답변은 관리 메모이며 메일로 보내지 않습니다.",
  },
};

export default async function ManageHomePage() {
  const session = await requireCmsStaff();
  const inquiries = await listInquiries();
  const pending = inquiries.filter((item) => item.status !== "answered").length;

  return (
    <>
      <PageHero
        kicker="관리"
        title="사이트 관리"
        lead={`${session.name} 님(${session.role === "supervisor" ? "감독" : session.role === "ceo" ? "CEO" : "관리자"}) · 공개 화면의 글과 사진을 고칩니다.`}
      />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <ManageI18nMigrate />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {manageNavItems().map((item) => {
            const cms = CMS_SLUGS.find((row) => item.href === `/manage/pages/${row.slug}`);
            const copy = CARD_COPY[item.i18n];
            const title = cms?.label ?? copy?.title ?? item.i18n;
            const lead =
              item.i18n === "manage.inquiries"
                ? `미답변 ${pending}건. ${copy?.lead ?? ""}`
                : cms?.slug === "funeral"
                  ? "절차 카드·안내 문구와 공공서류 PDF를 관리합니다."
                  : cms
                    ? "본문·항목을 수정합니다."
                    : (copy?.lead ?? "");
            return (
              <Link key={item.href} href={item.href} className="rounded-xl border bg-card p-5 shadow-sm hover:bg-accent">
                <h2 className="font-medium">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{lead}</p>
              </Link>
            );
          })}
          {session.role === "supervisor" ? (
            <Link href="/manage/admins" className="rounded-xl border bg-card p-5 shadow-sm hover:bg-accent">
              <h2 className="font-medium">관리자 계정</h2>
              <p className="mt-1 text-sm text-muted-foreground">감독만 관리자 아이디를 만듭니다.</p>
            </Link>
          ) : null}
        </div>
      </div>
    </>
  );
}
