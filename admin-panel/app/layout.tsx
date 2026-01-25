import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "SAMBAD | Super Admin",
    description: "Internal administration panel for SAMBAD",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
