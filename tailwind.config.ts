import type { Config } from "tailwindcss";

export default {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                transparent: "transparent",
                accent: "#49C196",
                "accent-hover": "#3A9A7D",
                primary: "#24282D",
                panel: "#363C44",
                "panel-hover": "#444b55",
                med: "#2E3338",
                light: "#93979f",
                border: "#5A636F",
                hover: "#2E3338",
                dark: "#1E2226",
            },
        },
    },
    plugins: [],
} satisfies Config;
