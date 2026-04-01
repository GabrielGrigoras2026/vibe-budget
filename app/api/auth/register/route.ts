import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    // 1. Citim datele din body
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, parolă și nume sunt obligatorii" },
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

    // 3. Creăm user în Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Eroare la înregistrare" },
        { status: 400 }
      );
    }

    // 4. Inserăm în tabela public.users (id = authUser.id)
    await db.insert(schema.users).values({
      id: authData.user.id,
      email,
      name,
    });

    // 5. Returnăm userul creat
    return NextResponse.json({
      user: {
        id: authData.user.id,
        email,
        name,
      },
    });
  } catch (error) {
    console.error("[AUTH_REGISTER] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
