import { redirect } from "next/navigation";

/** @deprecated → /manage/cms 메인 탭 */
export default function ManageHomeSlidesPage() {
  redirect("/manage/cms");
}
