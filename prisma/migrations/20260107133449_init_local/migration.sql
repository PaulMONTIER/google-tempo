-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "googleAccessToken" TEXT,
    "googleRefreshToken" TEXT,
    "googleTokenExpiry" TIMESTAMP(3),
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "priorityActivities" TEXT[],
    "studySubjects" TEXT[],
    "sportDiscipline" TEXT,
    "targetSoftSkills" TEXT[],
    "dailyNotificationTime" TEXT NOT NULL DEFAULT '08:00',
    "messageTone" TEXT NOT NULL DEFAULT 'supportive',
    "sportIntegrations" TEXT[],
    "acceptPromotionalContent" BOOLEAN NOT NULL DEFAULT false,
    "acceptPersonalizedOffers" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "UserProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "studiesPoints" INTEGER NOT NULL DEFAULT 0,
    "sportPoints" INTEGER NOT NULL DEFAULT 0,
    "proPoints" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastEventValidationDate" TIMESTAMP(3),
    "totalActions" INTEGER NOT NULL DEFAULT 0,
    "totalTasksCreated" INTEGER NOT NULL DEFAULT 0,
    "totalTasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalQuizzesCompleted" INTEGER NOT NULL DEFAULT 0,
    "eventsCompleted" INTEGER NOT NULL DEFAULT 0,
    "retroactiveAnalysisDone" BOOLEAN NOT NULL DEFAULT false,
    "retroactiveAnalysisDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XpHistory" (
    "id" TEXT NOT NULL,
    "userProgressId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "eventId" TEXT,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillFamily" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoDetect" BOOLEAN NOT NULL DEFAULT true,
    "keywords" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillDetail" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkillProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillFamilyId" TEXT NOT NULL,
    "skillDetailId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSkillProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "skillDetailId" TEXT NOT NULL,
    "eventId" TEXT,
    "type" TEXT NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "taskValidationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskValidation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventTitle" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "validatedAt" TIMESTAMP(3),
    "notes" TEXT,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizSeries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalQuizzes" INTEGER NOT NULL DEFAULT 4,
    "currentQuiz" INTEGER NOT NULL DEFAULT 1,
    "goalEventId" TEXT,
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesId" TEXT,
    "eventId" TEXT NOT NULL,
    "eventTitle" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 10,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "context" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "correctAnswer" INTEGER NOT NULL,
    "userAnswer" INTEGER,
    "isCorrect" BOOLEAN,
    "answeredAt" TIMESTAMP(3),
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "toolCalls" TEXT,
    "action" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreparationTree" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "goalEventId" TEXT NOT NULL,
    "goalTitle" TEXT NOT NULL,
    "goalDate" TIMESTAMP(3) NOT NULL,
    "detectionMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreparationTree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreparationBranch" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "branchEventId" TEXT NOT NULL,
    "branchTitle" TEXT NOT NULL,
    "branchDate" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreparationBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memoryType" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "context" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "skillId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserPreferences_userId_idx" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_userId_key" ON "UserProgress"("userId");

-- CreateIndex
CREATE INDEX "UserProgress_userId_idx" ON "UserProgress"("userId");

-- CreateIndex
CREATE INDEX "UserProgress_level_idx" ON "UserProgress"("level");

-- CreateIndex
CREATE INDEX "XpHistory_userProgressId_idx" ON "XpHistory"("userProgressId");

-- CreateIndex
CREATE INDEX "XpHistory_createdAt_idx" ON "XpHistory"("createdAt");

-- CreateIndex
CREATE INDEX "XpHistory_userProgressId_createdAt_idx" ON "XpHistory"("userProgressId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SkillFamily_name_key" ON "SkillFamily"("name");

-- CreateIndex
CREATE INDEX "SkillFamily_isActive_idx" ON "SkillFamily"("isActive");

-- CreateIndex
CREATE INDEX "SkillFamily_order_idx" ON "SkillFamily"("order");

-- CreateIndex
CREATE INDEX "SkillDetail_familyId_idx" ON "SkillDetail"("familyId");

-- CreateIndex
CREATE INDEX "UserSkillProgress_userId_idx" ON "UserSkillProgress"("userId");

-- CreateIndex
CREATE INDEX "UserSkillProgress_skillFamilyId_idx" ON "UserSkillProgress"("skillFamilyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSkillProgress_userId_skillFamilyId_skillDetailId_key" ON "UserSkillProgress"("userId", "skillFamilyId", "skillDetailId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_taskValidationId_key" ON "Activity"("taskValidationId");

-- CreateIndex
CREATE INDEX "Activity_skillDetailId_idx" ON "Activity"("skillDetailId");

-- CreateIndex
CREATE INDEX "Activity_eventId_idx" ON "Activity"("eventId");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaskValidation_eventId_key" ON "TaskValidation"("eventId");

-- CreateIndex
CREATE INDEX "TaskValidation_userId_idx" ON "TaskValidation"("userId");

-- CreateIndex
CREATE INDEX "TaskValidation_eventId_idx" ON "TaskValidation"("eventId");

-- CreateIndex
CREATE INDEX "TaskValidation_completed_idx" ON "TaskValidation"("completed");

-- CreateIndex
CREATE INDEX "TaskValidation_eventDate_idx" ON "TaskValidation"("eventDate");

-- CreateIndex
CREATE INDEX "TaskValidation_userId_eventDate_idx" ON "TaskValidation"("userId", "eventDate");

-- CreateIndex
CREATE INDEX "QuizSeries_userId_idx" ON "QuizSeries"("userId");

-- CreateIndex
CREATE INDEX "QuizSeries_goalEventId_idx" ON "QuizSeries"("goalEventId");

-- CreateIndex
CREATE INDEX "Quiz_userId_idx" ON "Quiz"("userId");

-- CreateIndex
CREATE INDEX "Quiz_eventId_idx" ON "Quiz"("eventId");

-- CreateIndex
CREATE INDEX "Quiz_seriesId_idx" ON "Quiz"("seriesId");

-- CreateIndex
CREATE INDEX "Quiz_completed_idx" ON "Quiz"("completed");

-- CreateIndex
CREATE INDEX "QuizQuestion_quizId_idx" ON "QuizQuestion"("quizId");

-- CreateIndex
CREATE INDEX "QuizQuestion_order_idx" ON "QuizQuestion"("order");

-- CreateIndex
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

-- CreateIndex
CREATE INDEX "Conversation_isArchived_idx" ON "Conversation"("isArchived");

-- CreateIndex
CREATE INDEX "Conversation_updatedAt_idx" ON "Conversation"("updatedAt");

-- CreateIndex
CREATE INDEX "ConversationMessage_conversationId_idx" ON "ConversationMessage"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationMessage_createdAt_idx" ON "ConversationMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PreparationTree_goalEventId_key" ON "PreparationTree"("goalEventId");

-- CreateIndex
CREATE INDEX "PreparationTree_userId_idx" ON "PreparationTree"("userId");

-- CreateIndex
CREATE INDEX "PreparationTree_goalEventId_idx" ON "PreparationTree"("goalEventId");

-- CreateIndex
CREATE INDEX "PreparationTree_goalDate_idx" ON "PreparationTree"("goalDate");

-- CreateIndex
CREATE UNIQUE INDEX "PreparationTree_userId_treeId_key" ON "PreparationTree"("userId", "treeId");

-- CreateIndex
CREATE UNIQUE INDEX "PreparationBranch_branchEventId_key" ON "PreparationBranch"("branchEventId");

-- CreateIndex
CREATE INDEX "PreparationBranch_treeId_idx" ON "PreparationBranch"("treeId");

-- CreateIndex
CREATE INDEX "PreparationBranch_branchEventId_idx" ON "PreparationBranch"("branchEventId");

-- CreateIndex
CREATE INDEX "PreparationBranch_branchDate_idx" ON "PreparationBranch"("branchDate");

-- CreateIndex
CREATE INDEX "AgentMemory_userId_idx" ON "AgentMemory"("userId");

-- CreateIndex
CREATE INDEX "AgentMemory_memoryType_idx" ON "AgentMemory"("memoryType");

-- CreateIndex
CREATE INDEX "AgentMemory_expiresAt_idx" ON "AgentMemory"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentMemory_userId_memoryType_key_key" ON "AgentMemory"("userId", "memoryType", "key");

-- CreateIndex
CREATE INDEX "Quest_userId_idx" ON "Quest"("userId");

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpHistory" ADD CONSTRAINT "XpHistory_userProgressId_fkey" FOREIGN KEY ("userProgressId") REFERENCES "UserProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillDetail" ADD CONSTRAINT "SkillDetail_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "SkillFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillProgress" ADD CONSTRAINT "UserSkillProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProgress"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillProgress" ADD CONSTRAINT "UserSkillProgress_skillFamilyId_fkey" FOREIGN KEY ("skillFamilyId") REFERENCES "SkillFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillProgress" ADD CONSTRAINT "UserSkillProgress_skillDetailId_fkey" FOREIGN KEY ("skillDetailId") REFERENCES "SkillDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_skillDetailId_fkey" FOREIGN KEY ("skillDetailId") REFERENCES "SkillDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_taskValidationId_fkey" FOREIGN KEY ("taskValidationId") REFERENCES "TaskValidation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskValidation" ADD CONSTRAINT "TaskValidation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProgress"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProgress"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "QuizSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationTree" ADD CONSTRAINT "PreparationTree_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationBranch" ADD CONSTRAINT "PreparationBranch_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "PreparationTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMemory" ADD CONSTRAINT "AgentMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
