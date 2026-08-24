import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (
            typeof email !== "string" ||
            !email.trim()
        ) {
            return NextResponse.json(
                {
                    exists: false,
                },
                { status: 400 }
            );
        }

        const supabaseAdmin =
            createClient(
                process.env
                    .NEXT_PUBLIC_SUPABASE_URL!,
                process.env
                    .SUPABASE_SERVICE_ROLE_KEY!,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false,
                    },
                }
            );

        const normalizedEmail =
            email.trim().toLowerCase();

        let page = 1;

        while (true) {
            const {
                data,
                error,
            } =
                await supabaseAdmin.auth.admin.listUsers(
                    {
                        page,
                        perPage: 1000,
                    }
                );

            if (error) {
                console.error(
                    "CHECK EMAIL ADMIN ERROR:",
                    error
                );

                return NextResponse.json(
                    {
                        error:
                            "Unable to check email.",
                    },
                    { status: 500 }
                );
            }

            const exists =
                data.users.some(
                    (user) =>
                        user.email
                            ?.toLowerCase() ===
                        normalizedEmail
                );

            if (exists) {
                return NextResponse.json({
                    exists: true,
                });
            }

            if (
                !data.users ||
                data.users.length <
                1000
            ) {
                break;
            }

            page++;
        }

        return NextResponse.json({
            exists: false,
        });
    } catch (error) {
        console.error(
            "CHECK EMAIL ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Unable to check email.",
            },
            { status: 500 }
        );
    }
}