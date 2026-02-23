import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

export interface TreeData {
    id: string;
    treeId: string;
    goalEventId: string;
    goalTitle: string;
    goalDate: Date;
    detectionMethod: string;
    branches: BranchData[];
    createdAt: Date;
    updatedAt: Date;
}

export interface BranchData {
    id: string;
    branchEventId: string;
    branchTitle: string;
    branchDate: Date;
    order: number;
    completed: boolean;
}

export interface CreateTreeInput {
    userId: string;
    treeId: string;
    goalEventId: string;
    goalTitle: string;
    goalDate: Date;
    detectionMethod?: string;
}

export interface CreateBranchInput {
    treeId: string;
    branchEventId: string;
    branchTitle: string;
    branchDate: Date;
    order: number;
}

/**
 * Service pour gérer les arbres de préparation en Prisma
 */
export const treeService = {
    /**
     * Récupère tous les arbres d'un utilisateur
     */
    async getTreesByUserId(userId: string): Promise<TreeData[]> {
        const trees = await prisma.preparationTree.findMany({
            where: { userId },
            include: {
                branches: {
                    orderBy: { branchDate: 'asc' },
                },
            },
            orderBy: { goalDate: 'asc' },
        });

        return trees.map((tree) => ({
            id: tree.id,
            treeId: tree.treeId,
            goalEventId: tree.goalEventId,
            goalTitle: tree.goalTitle,
            goalDate: tree.goalDate,
            detectionMethod: tree.detectionMethod,
            branches: tree.branches.map((b) => ({
                id: b.id,
                branchEventId: b.branchEventId,
                branchTitle: b.branchTitle,
                branchDate: b.branchDate,
                order: b.order,
                completed: new Date(b.branchDate) < new Date(),
            })),
            createdAt: tree.createdAt,
            updatedAt: tree.updatedAt,
        }));
    },

    /**
     * Récupère un arbre par son ID
     */
    async getTreeById(id: string): Promise<TreeData | null> {
        const tree = await prisma.preparationTree.findUnique({
            where: { id },
            include: {
                branches: {
                    orderBy: { branchDate: 'asc' },
                },
            },
        });

        if (!tree) return null;

        return {
            id: tree.id,
            treeId: tree.treeId,
            goalEventId: tree.goalEventId,
            goalTitle: tree.goalTitle,
            goalDate: tree.goalDate,
            detectionMethod: tree.detectionMethod,
            branches: tree.branches.map((b) => ({
                id: b.id,
                branchEventId: b.branchEventId,
                branchTitle: b.branchTitle,
                branchDate: b.branchDate,
                order: b.order,
                completed: new Date(b.branchDate) < new Date(),
            })),
            createdAt: tree.createdAt,
            updatedAt: tree.updatedAt,
        };
    },

    /**
     * Crée un nouvel arbre
     */
    async createTree(input: CreateTreeInput): Promise<TreeData> {
        logger.debug(`[tree-service] Creating tree: ${input.goalTitle}`);

        const tree = await prisma.preparationTree.create({
            data: {
                userId: input.userId,
                treeId: input.treeId,
                goalEventId: input.goalEventId,
                goalTitle: input.goalTitle,
                goalDate: input.goalDate,
                detectionMethod: input.detectionMethod || 'manual',
            },
            include: {
                branches: true,
            },
        });

        return {
            id: tree.id,
            treeId: tree.treeId,
            goalEventId: tree.goalEventId,
            goalTitle: tree.goalTitle,
            goalDate: tree.goalDate,
            detectionMethod: tree.detectionMethod,
            branches: [],
            createdAt: tree.createdAt,
            updatedAt: tree.updatedAt,
        };
    },

    /**
     * Ajoute une branche à un arbre
     * Note: input.treeId est le treeId textuel (ex: "tree_math_123"), pas l'ID Prisma
     */
    async addBranch(input: CreateBranchInput): Promise<BranchData> {
        logger.debug(`[tree-service] Adding branch: ${input.branchTitle} to tree: ${input.treeId}`);

        // On cherche l'arbre par son treeId textuel pour obtenir son ID Prisma
        const tree = await prisma.preparationTree.findFirst({
            where: { treeId: input.treeId },
        });

        if (!tree) {
            throw new Error(`Arbre non trouvé avec treeId: ${input.treeId}`);
        }

        const branch = await prisma.preparationBranch.create({
            data: {
                treeId: tree.id,  // Utiliser l'ID Prisma de l'arbre, pas le treeId textuel
                branchEventId: input.branchEventId,
                branchTitle: input.branchTitle,
                branchDate: input.branchDate,
                order: input.order,
            },
        });

        return {
            id: branch.id,
            branchEventId: branch.branchEventId,
            branchTitle: branch.branchTitle,
            branchDate: branch.branchDate,
            order: branch.order,
            completed: new Date(branch.branchDate) < new Date(),
        };
    },

    /**
     * Supprime un arbre et toutes ses branches
     */
    async deleteTree(id: string): Promise<void> {
        logger.debug(`[tree-service] Deleting tree: ${id}`);
        await prisma.preparationTree.delete({ where: { id } });
    },

    /**
     * Supprime une branche
     */
    async deleteBranch(id: string): Promise<void> {
        logger.debug(`[tree-service] Deleting branch: ${id}`);
        await prisma.preparationBranch.delete({ where: { id } });
    },

    /**
     * Trouve ou crée un arbre par son treeId
     */
    async findOrCreateTree(
        userId: string,
        treeId: string,
        goalData: Omit<CreateTreeInput, 'userId' | 'treeId'>
    ): Promise<TreeData> {
        const existing = await prisma.preparationTree.findUnique({
            where: { userId_treeId: { userId, treeId } },
            include: { branches: { orderBy: { branchDate: 'asc' } } },
        });

        if (existing) {
            return {
                id: existing.id,
                treeId: existing.treeId,
                goalEventId: existing.goalEventId,
                goalTitle: existing.goalTitle,
                goalDate: existing.goalDate,
                detectionMethod: existing.detectionMethod,
                branches: existing.branches.map((b) => ({
                    id: b.id,
                    branchEventId: b.branchEventId,
                    branchTitle: b.branchTitle,
                    branchDate: b.branchDate,
                    order: b.order,
                    completed: new Date(b.branchDate) < new Date(),
                })),
                createdAt: existing.createdAt,
                updatedAt: existing.updatedAt,
            };
        }

        return this.createTree({ userId, treeId, ...goalData });
    },

    /**
     * Supprime un arbre par l'ID de l'événement objectif
     */
    async deleteTreeByGoalEventId(goalEventId: string): Promise<void> {
        logger.debug(`[tree-service] Deleting tree by goalEventId: ${goalEventId}`);
        // On cherche d'abord l'arbre pour être sûr
        const tree = await prisma.preparationTree.findUnique({
            where: { goalEventId },
        });

        if (tree) {
            await prisma.preparationTree.delete({ where: { id: tree.id } });
        }
    },

    /**
     * Supprime une branche par l'ID de l'événement branche
     */
    async deleteBranchByEventId(branchEventId: string): Promise<void> {
        logger.debug(`[tree-service] Deleting branch by branchEventId: ${branchEventId}`);
        // On cherche d'abord la branche
        const branch = await prisma.preparationBranch.findUnique({
            where: { branchEventId },
        });

        if (branch) {
            await prisma.preparationBranch.delete({ where: { id: branch.id } });
        }
    },

    /**
     * Met à jour le titre d'un arbre
     */
    async updateTree(id: string, data: { goalTitle?: string; goalDate?: Date }): Promise<void> {
        logger.debug(`[tree-service] Updating tree: ${id}`);
        await prisma.preparationTree.update({
            where: { id },
            data,
        });
    },

    /**
     * Met à jour une branche
     */
    async updateBranch(id: string, data: { branchTitle?: string; branchDate?: Date }): Promise<void> {
        logger.debug(`[tree-service] Updating branch: ${id}`);
        await prisma.preparationBranch.update({
            where: { id },
            data,
        });
    },
};
