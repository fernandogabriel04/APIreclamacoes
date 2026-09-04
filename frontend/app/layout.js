import "../styles/globals.css";
import { Anton, Barlow } from "next/font/google";

const display = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Barlow({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "Ouvidoria JHC — Governo de Alagoas",
  description:
    "Canal oficial para o povo de Alagoas falar diretamente com JHC. Grave seu áudio e conte o que você quer para o seu município e para o estado.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
