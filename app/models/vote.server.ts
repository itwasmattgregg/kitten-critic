import type { User, Vote } from "@prisma/client";

import { prisma } from "~/db.server";

export type { Vote } from "@prisma/client";

export function getVoteListItemsForUser({ userId }: { userId: User["id"] }) {
  return prisma.vote.findMany({
    where: { userId },
    select: { id: true, url: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function getLeaderboardKittens() {
  return prisma.vote.groupBy({
    by: ["url"],
    _count: {
      up: true,
    },
    orderBy: {
      _count: {
        up: "desc",
      },
    },
    having: {
      up: {
        _count: {
          gt: 0,
        },
      },
    },
    take: 50,
  });
}

export function createVote({
  url,
  userId,
  up,
}: Pick<Vote, "url" | "up"> & {
  userId: User["id"];
}) {
  return prisma.vote.create({
    data: {
      url,
      up,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}
