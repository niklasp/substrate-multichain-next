import { ReferendaProvider } from "./referenda-context";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ReferendaProvider>{children}</ReferendaProvider>;
}
