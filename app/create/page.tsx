"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function CreateSarcasmPage() {
    const supabase = createClient();
    const router = useRouter();

    const [content, setContent] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [isPublic, setIsPublic] = useState(true);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    function handleFileChange(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        const selectedFile = e.target.files?.[0];

        if (!selectedFile) return;

        if (!selectedFile.type.startsWith("image/")) {
            setMessage("Please select an image file.");
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            setMessage("Image must be smaller than 5MB.");
            return;
        }

        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setMessage("");
    }

    async function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        if (!content.trim() && !file) {
            setMessage(
                "Please write something or upload an image."
            );
            return;
        }

        setLoading(true);
        setMessage("");

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            setMessage("You must be logged in to post.");
            setLoading(false);
            return;
        }

        let imageUrl: string | null = null;

        // ==============================
        // IMAGE UPLOAD
        // ==============================

        if (file) {
            const fileExtension =
                file.name.split(".").pop();

            const fileName =
                `${crypto.randomUUID()}.${fileExtension}`;

            const filePath =
                `${user.id}/${fileName}`;

            const {
                error: uploadError,
            } = await supabase.storage
                .from("memes")
                .upload(filePath, file);

            if (uploadError) {
                console.error(
                    "Image upload error:",
                    uploadError
                );

                setMessage(
                    uploadError.message
                );

                setLoading(false);
                return;
            }

            const {
                data: { publicUrl },
            } = supabase.storage
                .from("memes")
                .getPublicUrl(filePath);

            imageUrl = publicUrl;
        }

        // ==============================
        // CREATE MEME
        // ==============================

        const {
            error: insertError,
        } = await supabase
            .from("memes")
            .insert({
                author_id: user.id,
                content: content.trim(),
                image_url: imageUrl,
                is_public: isPublic,
            });

        if (insertError) {
            console.error(
                "Meme insert error:",
                insertError
            );

            setMessage(
                insertError.message
            );

            setLoading(false);
            return;
        }

        router.push("/");
        router.refresh();
    }

    return (
        <main className="min-h-screen bg-background text-foreground transition-colors duration-300">

            <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-border">

                {/* HEADER */}

                <header className="sticky top-0 z-20 border-b border-border bg-background/85 px-4 py-4 backdrop-blur-xl sm:px-6">

                    <div className="flex items-center gap-4">

                        <Link
                            href="/"
                            className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                        >
                            ← Home
                        </Link>

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
                                Humoura
                            </p>

                            <h1 className="text-xl font-bold">
                                Create Sarcasm
                            </h1>
                        </div>

                    </div>

                </header>

                {/* FORM */}

                <form
                    onSubmit={handleSubmit}
                    className="p-5 sm:p-6"
                >

                    <div className="rounded-3xl border border-border bg-card p-5 shadow-xl sm:p-6">

                        {/* TEXT */}

                        <textarea
                            value={content}
                            onChange={(e) =>
                                setContent(
                                    e.target.value
                                )
                            }
                            placeholder="Wash away your procrastination by uploading sarcasms..."
                            maxLength={500}
                            rows={6}
                            className="w-full resize-none bg-transparent text-[16px] leading-7 text-foreground outline-none placeholder:text-muted-foreground"
                        />

                        {/* CHARACTER COUNT */}

                        <div className="mt-2 text-right text-xs text-muted-foreground">
                            {content.length}/500
                        </div>

                        {/* IMAGE UPLOAD */}

                        <label className="mt-5 block cursor-pointer rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center transition hover:bg-accent">

                            <div className="text-lg font-semibold">
                                🖼️ Upload picture
                            </div>

                            <p className="mt-2 text-sm text-muted-foreground">
                                JPG, PNG, JPEG or WEBP • Max 5MB
                            </p>

                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={
                                    handleFileChange
                                }
                                className="hidden"
                            />

                        </label>

                        {/* PREVIEW */}

                        {preview && (
                            <div className="relative mt-5 overflow-hidden rounded-2xl border border-border bg-muted">
                                <img
                                    src={preview}
                                    alt="Meme preview"
                                    className="max-h-[600px] w-full object-contain"
                                />
                            </div>
                        )}

                        {/* VISIBILITY */}

                        <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-4">

                            <p className="text-sm font-bold">
                                Who can see this sarcasm?
                            </p>

                            <div className="mt-3 grid grid-cols-2 gap-2">

                                {/* PUBLIC */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsPublic(
                                            true
                                        )
                                    }
                                    className={`rounded-2xl border px-4 py-4 text-left transition ${isPublic
                                            ? "border-primary bg-primary/10"
                                            : "border-border bg-card hover:bg-accent"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">
                                            🌎
                                        </span>

                                        <span className="font-semibold">
                                            Public
                                        </span>
                                    </div>

                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        Anyone can see this post.
                                    </p>
                                </button>

                                {/* PRIVATE */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsPublic(
                                            false
                                        )
                                    }
                                    className={`rounded-2xl border px-4 py-4 text-left transition ${!isPublic
                                            ? "border-primary bg-primary/10"
                                            : "border-border bg-card hover:bg-accent"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">
                                            🔒
                                        </span>

                                        <span className="font-semibold">
                                            Private
                                        </span>
                                    </div>

                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        Only allowed people can see it.
                                    </p>
                                </button>

                            </div>

                        </div>

                        {/* ERROR */}

                        {message && (
                            <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500 dark:text-red-400">
                                {message}
                            </p>
                        )}

                        {/* BOTTOM */}

                        <div className="mt-5 flex items-center justify-between gap-4">

                            <span className="min-w-0 truncate text-sm text-muted-foreground">
                                {file
                                    ? file.name
                                    : "No image selected"}
                            </span>

                            <button
                                type="submit"
                                disabled={
                                    loading ||
                                    (!content.trim() &&
                                        !file)
                                }
                                className="shrink-0 rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {loading
                                    ? "Posting..."
                                    : "Post Sarcasm"}
                            </button>

                        </div>

                    </div>

                </form>

            </div>
        </main>
    );
}