import { NextRequest, NextResponse } from "next/server";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { getServerSession } from "next-auth";

import { agentExecutor } from "@/lib/agent/graph";
import { authOptions } from "@/lib/auth/auth-options";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié", requiresAuth: true },
        { status: 401 }
      );
    }

    if (session.error === "REAUTH_REQUIRED") {
      return NextResponse.json(
        {
          error: "Votre session Google a expiré. Veuillez vous reconnecter.",
          requiresReauth: true,
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Le champ "messages" est requis et doit être un tableau' },
        { status: 400 }
      );
    }

    console.log(`[API /chat] Starting agent for userId: ${userId}`);

    const formattedMessages = messages
      .map((msg: any) => {
        if (msg.role === "user") {
          return new HumanMessage(msg.content);
        }
        if (msg.role === "assistant") {
          return new AIMessage(msg.content);
        }
        return null;
      })
      .filter(Boolean);

    const config = {
      configurable: {
        userId,
      },
    };

    console.log(
      `[API /chat] Invoking agent with ${formattedMessages.length} messages`
    );

    const result = await agentExecutor.invoke(
      { messages: formattedMessages },
      config
    );

    const finalMessages = result.messages;
    const lastMessage = finalMessages[finalMessages.length - 1];

    // Nettoyer le markdown de la réponse
    let cleanContent = lastMessage.content || "";
    if (typeof cleanContent === 'string') {
      cleanContent = cleanContent
        .replace(/\*\*/g, '')  // Retire le gras
        .replace(/\*/g, '')    // Retire l'italique
        .replace(/#{1,6}\s/g, '') // Retire les titres
        .replace(/`/g, '')     // Retire le code inline
        .replace(/\[id:[^\]]+\]/g, ''); // Retire les IDs techniques
    }

    // 🔍 DEBUG: Ce que l'agent a produit
    console.log(`\n📦 [API /chat] Agent terminé`);
    console.log(`   Messages dans le résultat: ${finalMessages.length}`);
    console.log(`   Types de messages: ${finalMessages.map((m: any) => m.constructor.name).join(' → ')}`);
    console.log(`   Dernier message (envoyé au frontend): ${typeof lastMessage.content === 'string' ? lastMessage.content.substring(0, 200) : JSON.stringify(lastMessage.content).substring(0, 200)}`);
    if ((lastMessage as any).tool_calls?.length) {
      console.log(`   ⚠️  ATTENTION: Le dernier message contient encore des tool_calls non résolus !`);
    }

    const responseTime = Date.now() - startTime;
    console.log(`[API /chat] Agent completed in ${responseTime}ms`);

    let events: any[] = [];
    let action = "none";

    const toolMessages = finalMessages.filter(
      (msg: any) => msg.tool_calls?.length > 0
    );

    if (toolMessages.length > 0) {
      const lastToolMessage = toolMessages[toolMessages.length - 1];
      const toolCalls = lastToolMessage.tool_calls || [];

      if (toolCalls.some((tc: any) => tc.name === "create_calendar_event")) {
        action = "create";
      } else if (toolCalls.some((tc: any) => tc.name === "delete_calendar_event")) {
        action = "delete";
      } else if (
        toolCalls.some((tc: any) => tc.name === "find_free_slots")
      ) {
        action = "search";
      }
    }

    return NextResponse.json({
      message: cleanContent,
      events,
      action,
      metadata: {
        responseTime,
        toolCalls: toolMessages.length,
      },
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error(`[API /chat] Error after ${responseTime}ms:`, error);

    if (error.code === "REAUTH_REQUIRED") {
      return NextResponse.json(
        {
          error: "Votre session Google a expiré. Veuillez vous reconnecter.",
          requiresReauth: true,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Une erreur est survenue lors du traitement de votre demande",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Tempo Agent API",
    version: "1.0.0",
  });
}
