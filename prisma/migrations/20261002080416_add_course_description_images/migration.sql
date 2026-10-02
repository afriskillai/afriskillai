-- CreateTable
CREATE TABLE "CourseDescriptionImage" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "caption" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseDescriptionImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseDescriptionImage_courseId_idx" ON "CourseDescriptionImage"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseDescriptionImage_courseId_position_key" ON "CourseDescriptionImage"("courseId", "position");

-- AddForeignKey
ALTER TABLE "CourseDescriptionImage" ADD CONSTRAINT "CourseDescriptionImage_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
