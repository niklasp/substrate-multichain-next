import { ConfettiExplosionContainer } from "@/components/confetti-container";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ConfettiExplosionContainer />
      {children}
    </>
  );
}
