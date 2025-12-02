import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/api/session-service";
import { validateSession } from "@/lib/api/validators/session-validator";
import { transformMessagesToLangChain } from "@/lib/api/transformers/message-transformer";
import { cleanMarkdown } from "@/lib/api/cleaners/markdown-cleaner";
import { detectActionFromMessages } from "@/lib/api/analyzers/action-detector";
import { logger } from "@/lib/utils/logger";
import { handleApiError } from "@/lib/api/error-handler";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Validation de la session
    const session = await getAppSession();
    const validation = validateSession(session);

    if (validation.error) {
      return validation.error;
    }

    const userId = validation.userId;

    // Validation du body
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        {
          error: 'Le champ "messages" est requis et doit être un tableau',
          code: "INVALID_REQUEST",
        },
        { status: 400 }
      );
    }

    logger.debug(`[API /chat] Starting agent for userId: ${userId}`);

    // Transformation des messages
    const formattedMessages = transformMessagesToLangChain(messages);

    logger.debug(
      `[API /chat] Invoking agent with ${formattedMessages.length} messages`
    );

    // Exécution de l'agent (import dynamique pour éviter les cycles au build)
    const { getAgentExecutor } = await import("@/lib/agent/graph");
    const config = {
      configurable: {
        userId,
      },
    };

    const agentExecutor = getAgentExecutor();
    const result = await agentExecutor.invoke(
      { messages: formattedMessages },
      config
    );

    const finalMessages = result.messages;
    const lastMessage = finalMessages[finalMessages.length - 1];

    // Nettoyage du markdown
    const cleanContent = cleanMarkdown(lastMessage.content);

    // 🔍 DEBUG: Ce que l'agent a produit
    logger.debug(`\n📦 [API /chat] Agent terminé`);
    logger.debug(`   Messages dans le résultat: ${finalMessages.length}`);
    logger.debug(`   Types de messages: ${finalMessages.map((m: any) => m.constructor.name).join(' → ')}`);
    logger.debug(`   Dernier message (envoyé au frontend): ${typeof lastMessage.content === 'string' ? lastMessage.content.substring(0, 200) : JSON.stringify(lastMessage.content).substring(0, 200)}`);
    if ((lastMessage as any).tool_calls?.length) {
      logger.warn(`   ⚠️  ATTENTION: Le dernier message contient encore des tool_calls non résolus !`);
    }

    // Détection de l'action
    const action = detectActionFromMessages(finalMessages);
    const toolMessages = finalMessages.filter(
      (msg: any) => msg.tool_calls?.length > 0
    );

    const responseTime = Date.now() - startTime;
    logger.info(`[API /chat] Agent completed in ${responseTime}ms`);

    return NextResponse.json({
      message: cleanContent,
      events: [],
      action,
      metadata: {
        responseTime,
        toolCalls: toolMessages.length,
      },
    });
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;
    logger.error(`[API /chat] Error after ${responseTime}ms:`, error);
    return handleApiError(error, "chat");
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Tempo Agent API",
    version: "1.0.0",
  });
}
