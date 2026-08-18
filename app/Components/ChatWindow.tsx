"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
    id: string;
    sender_id: string;
    recipient_id: string;
    text: string;
    created_at: string;
    read: boolean;
};

type ChatWindowProps = {
    currentUserId: string;
    recipientId: string;
    recipientName: string;
    initialMessages: Message[];
};

export default function ChatWindow({
    currentUserId,
    recipientId,
    recipientName,
    initialMessages,
}: ChatWindowProps) {
    const supabase = createClient();

    const [messages, setMessages] =
        useState<Message[]>(
            initialMessages
        );

    const [text, setText] =
        useState("");

    const [sending, setSending] =
        useState(false);

    const bottomRef =
        useRef<HTMLDivElement | null>(null);

    // ========================================
    // SCROLL TO BOTTOM
    // ========================================

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages.length]);

    // ========================================
    // REALTIME
    // ========================================

    useEffect(() => {
        const channel = supabase
            .channel(
                `messages-${currentUserId}-${recipientId}`
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                async (payload) => {
                    const newMessage =
                        payload.new as Message;

                    const belongsToConversation =
                        (newMessage.sender_id ===
                            currentUserId &&
                            newMessage.recipient_id ===
                            recipientId) ||
                        (newMessage.sender_id ===
                            recipientId &&
                            newMessage.recipient_id ===
                            currentUserId);

                    if (
                        !belongsToConversation
                    ) {
                        return;
                    }

                    setMessages(
                        (previous) => {
                            if (
                                previous.some(
                                    (
                                        message
                                    ) =>
                                        message.id ===
                                        newMessage.id
                                )
                            ) {
                                return previous;
                            }

                            return [
                                ...previous,
                                newMessage,
                            ];
                        }
                    );

                    // Mark incoming message as read
                    if (
                        newMessage.sender_id ===
                        recipientId &&
                        newMessage.recipient_id ===
                        currentUserId
                    ) {
                        await supabase
                            .from("messages")
                            .update({
                                read: true,
                            })
                            .eq(
                                "id",
                                newMessage.id
                            )
                            .eq(
                                "recipient_id",
                                currentUserId
                            );

                        setMessages(
                            (previous) =>
                                previous.map(
                                    (
                                        message
                                    ) =>
                                        message.id ===
                                            newMessage.id
                                            ? {
                                                ...message,
                                                read: true,
                                            }
                                            : message
                                )
                        );
                    }
                }
            )
            .subscribe((status) => {
                console.log(
                    "MESSAGES REALTIME:",
                    status
                );
            });

        return () => {
            supabase.removeChannel(
                channel
            );
        };
    }, [
        currentUserId,
        recipientId,
    ]);

    // ========================================
    // SEND MESSAGE
    // ========================================

    async function sendMessage() {
        const messageText =
            text.trim();

        if (
            !messageText ||
            sending
        ) {
            return;
        }

        setSending(true);

        try {
            const {
                data:
                insertedMessage,
                error,
            } = await supabase
                .from("messages")
                .insert({
                    sender_id:
                        currentUserId,
                    recipient_id:
                        recipientId,
                    text: messageText,
                    read: false,
                })
                .select(
                    "id, sender_id, recipient_id, text, created_at, read"
                )
                .single();

            if (error) {
                console.error(
                    "SEND MESSAGE ERROR:",
                    {
                        message:
                            error.message,
                        details:
                            error.details,
                        hint:
                            error.hint,
                        code:
                            error.code,
                    }
                );

                return;
            }

            if (insertedMessage) {
                setMessages(
                    (previous) => {
                        if (
                            previous.some(
                                (
                                    message
                                ) =>
                                    message.id ===
                                    insertedMessage.id
                            )
                        ) {
                            return previous;
                        }

                        return [
                            ...previous,
                            insertedMessage,
                        ];
                    }
                );
            }

            setText("");
        } catch (error) {
            console.error(
                "UNEXPECTED MESSAGE ERROR:",
                error
            );
        } finally {
            setSending(false);
        }
    }

    function handleKeyDown(
        e: React.KeyboardEvent<HTMLInputElement>
    ) {
        if (
            e.key === "Enter" &&
            !e.shiftKey
        ) {
            e.preventDefault();
            sendMessage();
        }
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">

            {/* MESSAGES */}

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">

                {messages.length === 0 ? (
                    <div className="flex min-h-[50vh] items-center justify-center px-6 text-center">

                        <div>
                            <p className="text-lg text-white/50">
                                No messages yet.
                            </p>

                            <p className="mt-2 text-sm text-white/30">
                                Send the first message to{" "}
                                {recipientName}.
                            </p>
                        </div>

                    </div>
                ) : (
                    <div className="space-y-3">

                        {messages.map(
                            (message) => {
                                const mine =
                                    message.sender_id ===
                                    currentUserId;

                                return (
                                    <div
                                        key={
                                            message.id
                                        }
                                        className={`flex ${mine
                                                ? "justify-end"
                                                : "justify-start"
                                            }`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${mine
                                                    ? "rounded-br-md bg-white text-black"
                                                    : "rounded-bl-md bg-white/10 text-white"
                                                }`}
                                        >

                                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                                {
                                                    message.text
                                                }
                                            </p>

                                            <div
                                                className={`mt-1 flex justify-end gap-2 text-[10px] ${mine
                                                        ? "text-black/40"
                                                        : "text-white/30"
                                                    }`}
                                            >

                                                <span>
                                                    {new Date(
                                                        message.created_at
                                                    ).toLocaleTimeString(
                                                        [],
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        }
                                                    )}
                                                </span>

                                                {mine && (
                                                    <span>
                                                        {message.read
                                                            ? "Read"
                                                            : "Sent"}
                                                    </span>
                                                )}

                                            </div>

                                        </div>
                                    </div>
                                );
                            }
                        )}

                        <div
                            ref={bottomRef}
                        />

                    </div>
                )}

            </div>

            {/* SEND BOX */}

            <div className="sticky bottom-0 z-20 border-t border-white/10 bg-black px-4 py-3 sm:px-6">

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                    }}
                    className="flex gap-2 sm:gap-3"
                >

                    <input
                        type="text"
                        value={text}
                        onChange={(e) =>
                            setText(
                                e.target.value
                            )
                        }
                        onKeyDown={
                            handleKeyDown
                        }
                        placeholder="Write a message..."
                        disabled={sending}
                        className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
                    />

                    <button
                        type="submit"
                        disabled={
                            sending ||
                            !text.trim()
                        }
                        className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {sending
                            ? "..."
                            : "Send"}
                    </button>

                </form>

            </div>

        </div>
    );
}