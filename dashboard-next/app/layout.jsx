import "./globals.css";
import { ConsoleShell } from "./console-shell";

export const metadata = {
  title: "Forgevena Command Center",
  description: "Governed engineering from idea to production.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ConsoleShell>{children}</ConsoleShell>
      </body>
    </html>
  );
}
