"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function CreateSarcasmPage() {
    const supabase = createClient();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [content, setContent] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isPublic, setIsPublic] = useState(true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    function handleFileChange(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        const selectedFile = e.target.files?.[0];

        if (!selectedFile) return;

        if (!selectedFile.type.startsWith("image/")) {
            setMessage("Please select an image file.");
            e.target.value = "";
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            setMessage("Image must be smaller than 5MB.");
            e.target.value = "";
            return;
        }

        if (preview) {
            URL.revokeObjectURL(preview);
        }

        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setMessage("");
    }

    async function compressImage(
        originalFile: File
    ): Promise<File> {
        try {
            const bitmap = await createImageBitmap(originalFile);

            const maxSize = 1600;

            let width = bitmap.width;
            let height = bitmap.height;

            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = Math.round(
                        (height * maxSize) / width
                    );
                    width = maxSize;
                } else {
                    width = Math.round(
                        (width * maxSize) / height
                    );
                    height = maxSize;
                }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");

            if (!ctx) {
                bitmap.close();
                return originalFile;
            }

            ctx.drawImage(
                bitmap,
                0,
                0,
                width,
                height
            );

            bitmap.close();

            const blob = await new Promise<Blob | null>(
                (resolve) => {
                    canvas.toBlob(
                        resolve,
                        "image/jpeg",
                        0.82
                    );
                }
            );

            if (!blob) {
                return originalFile;
            }

            return new File(
                [blob],
                `${originalFile.name.replace(/\.[^/.]+$/, "")}.jpg`,
                {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                }
            );
        } catch {
            return originalFile;
        }
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

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                setMessage(
                    "You must be logged in to post."
                );
                setLoading(false);
                return;
            }

            let imageUrl: string | null = null;

            if (file) {
                const uploadFile = await compressImage(file);

                const fileName =
                    `${crypto.randomUUID()}.jpg`;

                const filePath =
                    `${user.id}/${fileName}`;

                const { error: uploadError } =
                    await supabase.storage
                        .from("memes")
                        .upload(
                            filePath,
                            uploadFile,
                            {
                                cacheControl: "3600",
                                upsert: false,
                                contentType:
                                    uploadFile.type,
                            }
                        );

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

            const { error: insertError } =
                await supabase
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

            router.replace("/");
            router.refresh();
        } catch (error) {
            console.error(
                "Post creation error:",
                error
            );

            setMessage(
                "Something went wrong while creating the post."
            );
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-border">

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

                <form
                    onSubmit={handleSubmit}
                    className="p-4 sm:p-6"
                >
                    <div className="rounded-3xl border border-border bg-card p-4 shadow-xl sm:p-6">

                        <textarea
                            value={content}
                            onChange={(e) =>
                                setContent(e.target.value)
                            }
                            placeholder="Wash away your procrastination by uploading sarcasms..."
                            maxLength={500}
                            rows={6}
                            className="w-full resize-none bg-transparent text-[16px] leading-7 text-foreground outline-none placeholder:text-muted-foreground"
                        />

                        <div className="mt-2 text-right text-xs text-muted-foreground">
                            {content.length}/500
                        </div>

                        <label
                            htmlFor="meme-image"
                            className="mt-5 block cursor-pointer touch-manipulation rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center transition hover:bg-accent"
                        >
                            <div className="text-lg font-semibold">
                                🖼️ Upload picture
                            </div>

                            <p className="mt-2 text-sm text-muted-foreground">
                                JPG, PNG, JPEG or WEBP • Max 5MB
                            </p>

                            <input
                                ref={fileInputRef}
                                id="meme-image"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="sr-only"
                            />
                        </label>

                        {preview && (
                            <div className="relative mt-5 overflow-hidden rounded-2xl border border-border bg-muted">
                                <img
                                    src={preview}
                                    alt="Meme preview"
                                    className="max-h-[600px] w-full object-contain"
                                />
                            </div>
                        )}

                        <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-4">
                            <p className="text-sm font-bold">
                                Who can see this sarcasm?
                            </p>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsPublic(true)
                                    }
                                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                                        isPublic
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

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsPublic(false)
                                    }
                                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                                        !isPublic
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

                        {message && (
                            <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500 dark:text-red-400">
                                {message}
                            </p>
                        )}

                        <div className="mt-5 flex items-center justify-between gap-4">
                            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
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
                                className="shrink-0 touch-manipulation rounded-full bg-primary px-5 py-2.5 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
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