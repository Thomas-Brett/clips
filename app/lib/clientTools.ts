"use client";

export function formatDate(date: number, time: boolean = false, relative: boolean = true) {
    const dateObj = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();

    if (relative) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
        if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
        if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
        return `${diffYears} year${diffYears !== 1 ? "s" : ""} ago`;
    }

    return (
        dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) +
        (time ? ` ${dateObj.getHours()}:${dateObj.getMinutes() >= 10 ? dateObj.getMinutes() : "0" + dateObj.getMinutes()}` : "")
    );
}
