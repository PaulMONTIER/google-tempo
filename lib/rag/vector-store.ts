import { getEmbeddings } from "./embeddings";
import { Document } from "@langchain/core/documents";

// For the MVP, we use a simple in-memory array to store document embeddings.
// In a production app, this would be replaced by a persistent store (e.g., PgVector, Pinecone, Supabase)
interface StoredDocument {
    document: Document;
    embedding: number[];
}

let globalVectorStore: StoredDocument[] = [];

/**
 * Calculates cosine similarity between two vectors.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Adds documents to the vector store.
 * @param documents Array of LangChain Documents containing text and metadata
 */
export async function addDocumentsToStore(documents: Document[]) {
    const embeddingsModel = getEmbeddings();

    // Generate embeddings for all documents
    const texts = documents.map(doc => doc.pageContent);
    const embeddings = await embeddingsModel.embedDocuments(texts);

    // Store them
    for (let i = 0; i < documents.length; i++) {
        globalVectorStore.push({
            document: documents[i],
            embedding: embeddings[i]
        });
    }

    console.log(`[VectorStore] Added ${documents.length} document chunks to store.`);
}

/**
 * Searches the vector store for similar documents.
 * @param query The search query
 * @param k The number of results to return
 * @param filter Optional metadata filter
 */
export async function searchSimilarDocuments(query: string, k: number = 4, filter?: any) {
    if (globalVectorStore.length === 0) return [];

    const embeddingsModel = getEmbeddings();
    const queryEmbedding = await embeddingsModel.embedQuery(query);

    // Calculate similarities
    const results = globalVectorStore.map(stored => ({
        document: stored.document,
        similarity: cosineSimilarity(queryEmbedding, stored.embedding)
    }));

    // Filter and sort
    let filteredResults = results;
    if (filter && filter.userId) {
        filteredResults = results.filter(res => res.document.metadata?.userId === filter.userId);
    }

    filteredResults.sort((a, b) => b.similarity - a.similarity);

    // Return top K
    return filteredResults.slice(0, k).map(res => res.document);
}
