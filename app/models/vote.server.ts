import type { User, Vote } from "@prisma/client";

import { prisma } from "~/db.server";

export type { Vote } from "@prisma/client";

export function getVote({
  id,
  userId,
}: Pick<Vote, "id"> & {
  userId: User["id"];
}) {
  return prisma.vote.findFirst({
    where: { id, userId },
  });
}

export function getVoteListItems({ userId }: { userId: User["id"] }) {
  return prisma.vote.findMany({
    where: { userId },
    select: { id: true, url: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function createVote({
  url,
  userId,
}: Pick<Vote, "url"> & {
  userId: User["id"];
}) {
  return prisma.vote.create({
    data: {
      url,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}
