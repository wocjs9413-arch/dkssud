import type { Metadata } from "next";
import { Jua } from "next/font/google";
import "./globals.css";

const jua = Jua({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-jua",
});

export const metadata: Metadata = {
  title: "나만의 교육용 웹앱 만들기",
  description: "파스텔 톤의 귀여운 유아용 앱 보일러플레이트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${jua.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-jua">
        {children}
      </body>
    </html>
  );
}
