-- AlterTable
ALTER TABLE "Webpage" ADD COLUMN     "archiveId" INTEGER;

-- AddForeignKey
ALTER TABLE "Webpage" ADD CONSTRAINT "Webpage_archiveId_fkey" FOREIGN KEY ("archiveId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
