import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    if (!code) {
        return NextResponse.redirect(
            new URL(
                "/?error=missing_code",
                requestUrl.origin
            )
        );
    }

    const supabase = await createClient();

    // Exchange the magic-link code for a session
    const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(
            code
        );

    if (exchangeError) {
        console.error(
            "AUTH CALLBACK ERROR:",
            exchangeError
        );

        return NextResponse.redirect(
            new URL(
                "/?error=auth_callback",
                requestUrl.origin
            )
        );
    }

    // Get the authenticated user
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.redirect(
            new URL(
                "/?error=missing_user",
                requestUrl.origin
            )
        );
    }

    // Check whether the user already has a profile
    const {
        data: profile,
        error: profileError,
    } = await supabase
        .from("profiles")
        .select(
            "id, username, full_name, avatar_url"
        )
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
        console.error(
            "PROFILE CHECK ERROR:",
            profileError
        );

        return NextResponse.redirect(
            new URL(
                "/profile/setup",
                requestUrl.origin
            )
        );
    }

    // No profile OR no username
    if (
        !profile ||
        !profile.username ||
        profile.username.trim() === ""
    ) {
        return NextResponse.redirect(
            new URL(
                "/profile/setup",
                requestUrl.origin
            )
        );
    }

    // Existing properly configured user
    return NextResponse.redirect(
        new URL(
            "/",
            requestUrl.origin
        )
    );
}