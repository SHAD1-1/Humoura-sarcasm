"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CreateSarcasmPage() {
    const supabase = createClient();
    const router = useRouter();

    const [content, setContent] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!content.trim() && !file) {
            setMessage("Please write something or upload an image.");
            return;
        }

        setLoading(true);
        setMessage("");

        // Get currently logged-in user
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

        // Upload image if one was selected
        if (file) {
            const fileExtension = file.name.split(".").pop();
            const fileName = `${crypto.randomUUID()}.${fileExtension}`;

            // Store images inside the user's own folder
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("memes")
                .upload(filePath, file);

            if (uploadError) {
                console.error("Image upload error:", uploadError);
                setMessage(uploadError.message);
                setLoading(false);
                return;
            }

            // Get public URL
            const {
                data: { publicUrl },
            } = supabase.storage
                .from("memes")
                .getPublicUrl(filePath);

            imageUrl = publicUrl;
        }

        // Create the meme
        const { error: insertError } = await supabase
            .from("memes")
            .insert({
                author_id: user.id,
                content: content.trim(),
                image_url: imageUrl,
            });

        if (insertError) {
            console.error("Meme insert error:", insertError);
            setMessage(insertError.message);
            setLoading(false);
            return;
        }

        // Go back home
        router.push("/");
        router.refresh();
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto w-full max-w-2xl border-x border-white/10">

                {/* Header */}
                <header className="border-b border-white/10 px-6 py-4">
                    <h1 className="text-xl font-bold">
                        Create Sarcasm
                    </h1>
                </header>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="p-6"
                >

                    {/* Text */}
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind? 👀"
                        maxLength={500}
                        rows={6}
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 text-white outline-none placeholder:text-white/40 focus:border-white/30"
                    />

                    {/* Character count */}
                    <div className="mt-2 text-right text-sm text-white/40">
                        {content.length}/500
                    </div>

                    {/* Image Upload */}
                    <label className="mt-5 block cursor-pointer rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center transition hover:bg-white/10">

                        <div className="text-lg font-semibold">
                            🖼️ Upload Meme
                        </div>

                        <p className="mt-2 text-sm text-white/40">
                            JPG, PNG, JPEG or WEBP • Max 5MB
                        </p>

                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                    </label>

                    {/* Image Preview */}
                    {preview && (
                        <div className="relative mt-5 overflow-hidden rounded-xl border border-white/10">
                            <img
                                src={preview}
                                alt="Meme preview"
                                className="max-h-[600px] w-full object-contain"
                            />
                        </div>
                    )}

                    {/* Error message */}
                    {message && (
                        <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                            {message}
                        </p>
                    )}

                    {/* Bottom section */}
                    <div className="mt-5 flex items-center justify-between">

                        <span className="text-sm text-white/40">
                            {file ? file.name : "No image selected"}
                        </span>

                        <button
                            type="submit"
                            disabled={loading || (!content.trim() && !file)}
                            className="rounded-full bg-white px-6 py-2 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {loading ? "Posting..." : "Post"}
                        </button>

                    </div>

                </form>
            </div>
        </main>
    );
}