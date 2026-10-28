import { Plus_Jakarta_Sans } from "next/font/google";
import "../styles/globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata = {
  title: { default: "Ouvidoria Inteligente | Prefeitura de Maceió", template: "%s | Ouvidoria Inteligente" },
  description: "Conte para a Prefeitura de Maceió o que pode melhorar na sua cidade. Grave um áudio de até 1 minuto.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={jakarta.variable}>
      <body className="font-sans min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
