import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { addDocumentsToStore } from "./vector-store";
import { DriveFileContent } from "@/types/integrations";

/**
 * Ingests Drive documents into the vector store.
 * Standardizes the text, chunks it, and adds metadata.
 */
export async function ingestDocuments(files: DriveFileContent[], userId: string) {
    const documents: Document[] = [];

    for (const file of files) {
        if (!file.content) continue;

        const doc = new Document({
            pageContent: file.content,
            metadata: {
                fileId: file.id,
                title: file.name,
                mimeType: file.mimeType,
                userId: userId,
                ingestedAt: new Date().toISOString(),
            },
        });
        documents.push(doc);
    }

    if (documents.length === 0) {
        console.log("[RAG Ingestion] No valid documents to ingest.");
        return { success: true, chunksIngested: 0 };
    }

    // Split documents into smaller chunks for better retrieval
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const splitDocs = await textSplitter.splitDocuments(documents);

    // Add to vector store
    await addDocumentsToStore(splitDocs);

    return {
        success: true,
        filesProcessed: documents.length,
        chunksIngested: splitDocs.length,
    };
}
