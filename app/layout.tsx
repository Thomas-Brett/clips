import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { UserProvider } from "./context/userContext";
import { ModalProvider } from "./context/modalContext";

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});
const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

export const metadata: Metadata = {
    title: "Clips",
    description: "A platform for sharing clips",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} bg-secondary antialiased`}>
                <UserProvider initialUser={null}>
                    <ModalProvider>{children}</ModalProvider>
                </UserProvider>
            </body>
        </html>
    );
}
