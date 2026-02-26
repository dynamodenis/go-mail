-- CreateTable
CREATE TABLE "TemplateAttachment" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateMergeTag" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateMergeTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemplateAttachment_templateId_idx" ON "TemplateAttachment"("templateId");

-- CreateIndex
CREATE INDEX "TemplateAttachment_userId_idx" ON "TemplateAttachment"("userId");

-- CreateIndex
CREATE INDEX "TemplateMergeTag_templateId_idx" ON "TemplateMergeTag"("templateId");

-- CreateIndex
CREATE INDEX "TemplateMergeTag_userId_idx" ON "TemplateMergeTag"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateMergeTag_templateId_value_key" ON "TemplateMergeTag"("templateId", "value");

-- AddForeignKey
ALTER TABLE "TemplateAttachment" ADD CONSTRAINT "TemplateAttachment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateMergeTag" ADD CONSTRAINT "TemplateMergeTag_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
