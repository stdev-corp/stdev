-- CreateEnum
CREATE TYPE "BusinessCategory" AS ENUM ('hackathon', 'ideathon', 'conference', 'program');

-- CreateEnum
CREATE TYPE "BusinessRole" AS ENUM ('host', 'organizer', 'sponsor', 'partner');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MarkdownType" ADD VALUE 'hackathon';
ALTER TYPE "MarkdownType" ADD VALUE 'conference';

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "category" "BusinessCategory" NOT NULL DEFAULT 'hackathon',
ADD COLUMN     "content" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "coverImageId" INTEGER,
ADD COLUMN     "hasTime" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "notionId" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "showOnHome" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "nameEn" DROP NOT NULL,
ALTER COLUMN "url" DROP NOT NULL,
ALTER COLUMN "logoId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "BusinessPage" (
    "id" SERIAL NOT NULL,
    "businessId" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "coverImageId" INTEGER,
    "content" TEXT NOT NULL DEFAULT '',
    "notionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessInstitution" (
    "businessId" INTEGER NOT NULL,
    "institutionId" INTEGER NOT NULL,
    "role" "BusinessRole" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BusinessInstitution_pkey" PRIMARY KEY ("businessId","institutionId","role")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessPage_notionId_key" ON "BusinessPage"("notionId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessPage_businessId_path_key" ON "BusinessPage"("businessId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Business_notionId_key" ON "Business"("notionId");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "ImageAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPage" ADD CONSTRAINT "BusinessPage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPage" ADD CONSTRAINT "BusinessPage_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "ImageAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessInstitution" ADD CONSTRAINT "BusinessInstitution_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessInstitution" ADD CONSTRAINT "BusinessInstitution_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

