import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
    metadataBase: new URL(
        "https://humoura-sarcasm.vercel.app"
    ),

    title: {
        default: "Humoura — Why so serious?",
        template: "%s | Humoura",
    },

    description:
        "Humoura is a social platform for sarcasm, memes, jokes, and sharing your sense of humor.",

    applicationName: "Humoura",

    verification: {
        google:
            "OsbcP56l2QWU_QBQ8b90LOMnfxZpHxO3k07L3ej49C8",
    },

    openGraph: {
        title: "Humoura — Why so serious?",
        description:
            "Share sarcasm, memes, jokes, and humor with Humoura.",
        url: "https://humoura-sarcasm.vercel.app",
        siteName: "Humoura",
        type: "website",
        locale: "en_US",
    },

    twitter: {
        card: "summary",
        title: "Humoura — Why so serious?",
        description:
            "Share sarcasm, memes, jokes, and humor with Humoura.",
    },

    robots: {
        index: true,
        follow: true,
    },
};

const themeScript = `
(function () {
    try {
        var savedTheme = localStorage.getItem("humoura-theme");
        var theme =
            savedTheme === "light" || savedTheme === "dark"
                ? savedTheme
                : "dark";

        var root = document.documentElement;

        root.classList.toggle(
            "dark",
            theme === "dark"
        );

        root.style.colorScheme = theme;
    } catch (error) {
        document.documentElement.classList.add("dark");
    }
})();
`;

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className="h-full antialiased"
        >
            <head>
                <Script
                    id="humoura-theme"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: themeScript,
                    }}
                />
            </head>

            <body className="min-h-full flex flex-col">
                {children}
            </body>
        </html>
    );
}