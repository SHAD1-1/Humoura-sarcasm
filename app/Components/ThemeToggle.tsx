"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
    const [theme, setTheme] =
        useState<Theme>("dark");

    useEffect(() => {
        const saved =
            localStorage.getItem(
                "humoura-theme"
            );

        const initialTheme: Theme =
            saved === "light"
                ? "light"
                : "dark";

        setTheme(initialTheme);

        document.documentElement.classList.toggle(
            "dark",
            initialTheme === "dark"
        );

        document.documentElement.style.colorScheme =
            initialTheme;
    }, []);

    function toggleTheme() {
        const nextTheme: Theme =
            theme === "dark"
                ? "light"
                : "dark";

        setTheme(nextTheme);

        localStorage.setItem(
            "humoura-theme",
            nextTheme
        );

        document.documentElement.classList.toggle(
            "dark",
            nextTheme === "dark"
        );

        document.documentElement.style.colorScheme =
            nextTheme;
    }

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"
                } mode`}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground shadow-sm transition hover:bg-accent"
        >
            <span className="text-base">
                {theme === "dark" ? "🌙" : "☀️"}
            </span>

            <span className="hidden sm:inline">
                {theme === "dark" ? "Insomnia" : "Bored"}
            </span>

            <span
                className={`relative block h-5 w-9 shrink-0 rounded-full transition-colors ${theme === "dark"
                    ? "bg-muted"
                    : "bg-primary"
                    }`}
            >
                <span
                    className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${theme === "dark"
                        ? "translate-x-0"
                        : "translate-x-4"
                        }`}
                />
            </span>
        </button>
    );
}