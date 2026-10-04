-- CreateEnum
CREATE TYPE "CourseFileType" AS ENUM ('PDF', 'WORD', 'ZIP');

-- CreateTable
CREATE TABLE "CourseFile" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "type" "CourseFileType" NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseFile_courseId_idx" ON "CourseFile"("courseId");

-- CreateIndex
CREATE INDEX "CourseFile_courseId_type_idx" ON "CourseFile"("courseId", "type");

-- CreateIndex
CREATE INDEX "CourseFile_createdAt_idx" ON "CourseFile"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CourseFile_courseId_position_key" ON "CourseFile"("courseId", "position");

-- AddForeignKey
ALTER TABLE "CourseFile" ADD CONSTRAINT "CourseFile_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
