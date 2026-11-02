// The home page carries its own Swiss Ink footer, so it skips the shared marketing Footer.
export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
