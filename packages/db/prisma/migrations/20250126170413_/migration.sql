/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Shape` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Shape` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `Shape` table. All the data in the column will be lost.
  - You are about to drop the column `fillColor` on the `Shape` table. All the data in the column will be lost.
  - You are about to drop the column `isPersonal` on the `Shape` table. All the data in the column will be lost.
  - You are about to drop the column `strokeColor` on the `Shape` table. All the data in the column will be lost.
  - You are about to drop the column `strokeWidth` on the `Shape` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Shape` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Shape` table. All the data in the column will be lost.
  - You are about to drop the column `x` on the `Shape` table. All the data in the column will be lost.
  - You are about to drop the column `y` on the `Shape` table. All the data in the column will be lost.
  - You are about to drop the `Chat` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `Shape` table without a default value. This is not possible if the table is not empty.
  - Made the column `roomId` on table `Shape` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_roomId_fkey";

-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_userId_fkey";

-- DropForeignKey
ALTER TABLE "Shape" DROP CONSTRAINT "Shape_roomId_fkey";

-- AlterTable
ALTER TABLE "Shape" DROP COLUMN "createdAt",
DROP COLUMN "createdBy",
DROP COLUMN "details",
DROP COLUMN "fillColor",
DROP COLUMN "isPersonal",
DROP COLUMN "strokeColor",
DROP COLUMN "strokeWidth",
DROP COLUMN "type",
DROP COLUMN "updatedAt",
DROP COLUMN "x",
DROP COLUMN "y",
ADD COLUMN     "message" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "roomId" SET NOT NULL;

-- DropTable
DROP TABLE "Chat";

-- AddForeignKey
ALTER TABLE "Shape" ADD CONSTRAINT "Shape_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shape" ADD CONSTRAINT "Shape_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
