import { ManageCmsShell } from "@/components/manage/manage-cms-shell";
import { getHomeIntroSlidesSettingsForWrite } from "@/lib/home-intro-slides";

export default async function ManageCmsPage() {
  const homeInitial = await getHomeIntroSlidesSettingsForWrite();
  return <ManageCmsShell homeInitial={homeInitial} />;
}