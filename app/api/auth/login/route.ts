import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // 1. Citim datele din body
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email și parolă sunt obligatorii" },
        { status: 400 }
      );
    }

    // 2. Creăm Supabase server client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // 3. Autentificăm via Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Email sau parolă incorectă" },
        { status: 401 }
      );
    }

    // 4. Căutăm userul în public.users
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, authData.user.id))
      .limit(1);

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Utilizatorul nu există" },
        { status: 404 }
      );
    }

    const user = users[0];

    // 5. Returnăm userul
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nativeCurrency: user.nativeCurrency,
      },
    });
  } catch (error) {
    console.error("[AUTH_LOGIN] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
