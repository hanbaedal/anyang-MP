import { IntroSwipe } from "@/components/intro-swipe";

export default function IntroLayout({ children }: { children: React.ReactNode }) {
  return <IntroSwipe>{children}</IntroSwipe>;
}
