import { SiteNav } from "@/components/swiss/SiteNav";
import { SiteFooter } from "@/components/swiss/SiteFooter";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav />
      {children}
      <SiteFooter />
    </>
  );
}
