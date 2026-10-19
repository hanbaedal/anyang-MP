import { WorkCopyEmpty } from "@/components/work-copy-empty";
import { WorkCopiedTable } from "@/components/work-copied-table";
import { WorkContractFilter } from "@/components/work-lookup-filters";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { loadWorkCopyPage } from "@/lib/work";
import { countUndatedContracts, listContractYearsFast, listContractsForYear } from "@/lib/work-store";
import { burialDateInRange, parseIsoYmd, parseYearParam, tombNoMatches } from "@/lib/work-status";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "work.contracts") };
}

export default async function WorkContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; tomb?: string; burialFrom?: string; burialTo?: string }>;
}) {
  const params = await searchParams;
  const { locale, session, dump, envReady } = await loadWorkCopyPage("master");
  const years = await listContractYearsFast();
  const year = parseYearParam(params.year, years);
  const tomb = params.tomb?.trim() ?? "";
  const burialFrom = parseIsoYmd(params.burialFrom);
  const burialTo = parseIsoYmd(params.burialTo);
  const ofYear = await listContractsForYear(year);
  const matched = ofYear.filter(
    (row) => tombNoMatches(row, tomb) && burialDateInRange(row, burialFrom, burialTo),
  );
  const undated = await countUndatedContracts();
  const rows = matched.map((row) => ({
    tombNo: row.tombNo,
    burialDate: row.burialDate,
    userName: row.userName,
    familyName: row.familyName,
    pyeong: row.pyeong,
    address: row.address,
  }));
  const copyMissing = (dump.meta?.contractCount ?? dump.meta?.listedContractTotal ?? years.length) === 0;
  const lead = copyMissing
    ? undefined
    : [
        t(locale, rows.length ? "work.contractYearLead" : "work.contractYearEmpty", {
          year,
          n: rows.length.toLocaleString("ko-KR"),
        }),
        undated > 0 ? t(locale, "work.contractUndatedNote", { n: undated.toLocaleString("ko-KR") }) : "",
      ]
        .filter(Boolean)
        .join(" ");

  return (
    <WorkCopiedTable
      title={t(locale, "work.contracts")}
      lead={lead}
      syncedAt={dump.meta?.syncedAt}
      toolbar={
        <WorkContractFilter
          locale={locale}
          years={years}
          year={year}
          tomb={tomb}
          burialFrom={params.burialFrom ?? ""}
          burialTo={params.burialTo ?? ""}
        />
      }
      columns={[
        { key: "tombNo", label: "묘지번호" },
        { key: "burialDate", label: "매장일자" },
        { key: "userName", label: "사용자" },
        { key: "familyName", label: "연고자" },
        { key: "pyeong", label: "평수" },
        { key: "address", label: "주소(연고자)" },
      ]}
      rows={rows}
      empty={
        copyMissing ? (
          <WorkCopyEmpty locale={locale} role={session.role} envReady={envReady} storage={dump.storage} />
        ) : (
          <p className="rounded-lg border bg-card px-4 py-6 text-sm text-muted-foreground">
            {t(locale, "work.contractYearEmpty", { year })}
          </p>
        )
      }
    />
  );
}
