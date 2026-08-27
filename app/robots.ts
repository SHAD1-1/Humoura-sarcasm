export default function robots() {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
        },
        sitemap:
            "https://humoura-sarcasm.vercel.app/sitemap.xml",
    };
}
