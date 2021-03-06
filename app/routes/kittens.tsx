import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  ShouldReloadFunction,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { createVote, getVoteListItemsForUser } from "~/models/vote.server";

import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

type LoaderData = {
  images: {
    id: string;
    height: number;
    width: number;
    link: string;
    title: string;
  }[];
};

type ActionData = {
  errors?: {
    url?: string;
    vote?: string;
  };
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Client-ID 834aeea9283216e");

  var requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow" as RequestRedirect,
  };

  const userVoteUrls = await (
    await getVoteListItemsForUser({ userId })
  ).map((voteItem) => voteItem.url);

  async function getKittens(page: number): Promise<LoaderData["images"]> {
    const response = await (
      await fetch(
        `https://api.imgur.com/3/gallery/r/kittens/time/week/${page}`,
        requestOptions
      )
    ).json();
    const images: LoaderData["images"] = response.data;

    const filteredImages = images.filter(
      (image) => userVoteUrls.indexOf(image.link) === -1
    );

    console.log(filteredImages.length);

    if (filteredImages.length === 0) {
      return filteredImages.concat(await getKittens(page + 1));
    } else {
      return filteredImages;
    }
  }

  let images = await getKittens(1);

  return json<LoaderData>({ images });
};

export const unstable_shouldReload: ShouldReloadFunction = ({ submission }) => {
  const formData = submission?.formData;
  const kittensLeft = formData?.get("kittensLeft");
  console.log(kittensLeft, typeof kittensLeft);
  if (kittensLeft === "1") {
    return true;
  }

  return false;
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const url = formData.get("url");
  const up = formData.get("up");

  if (typeof url !== "string") {
    return json<ActionData>(
      { errors: { url: "Url is required" } },
      { status: 400 }
    );
  }

  try {
    await createVote({
      url,
      up: up === "up" ? true : false,
      userId,
    });
    return json({ ok: true });
  } catch (error: any) {
    return json({ error: error.message });
  }
};

export default function KittensPage() {
  const data = useLoaderData() as LoaderData;
  const fetcher = useFetcher();
  const user = useUser();
  const [kittensToVoteOn, setKittensToVoteOn] = useState(data.images);
  const displayedKittens = kittensToVoteOn.slice(0, 1);

  useEffect(() => {
    setKittensToVoteOn(data.images);
  }, [data]);

  const x = useMotionValue(0);
  const xInput = [-100, 0, 100];
  const rotateValue = useTransform(x, [-200, 200], [-20, 20]);
  const color = useTransform(x, xInput, [
    "rgb(211, 9, 225)",
    "rgb(68, 0, 255)",
    "rgb(3, 209, 0)",
  ]);
  const tickPath = useTransform(x, [10, 100], [0, 1]);
  const crossPathA = useTransform(x, [-10, -55], [0, 1]);
  const crossPathB = useTransform(x, [-50, -100], [0, 1]);
  const svgOpacity = useTransform(x, [-100, -10, 10, 100], [1, 0, 0, 1]);

  async function voteUp() {
    const { link: url, title } = displayedKittens[0];
    await fetcher.submit(
      { url, up: "up", title, kittensLeft: kittensToVoteOn.length.toString() },
      { method: "post" }
    );
    setKittensToVoteOn(kittensToVoteOn.slice(1));
  }
  async function voteDown() {
    const { link: url, title } = displayedKittens[0];
    await fetcher.submit(
      { url, title, kittensLeft: kittensToVoteOn.length.toString() },
      { method: "post" }
    );
    setKittensToVoteOn(kittensToVoteOn.slice(1));
  }

  const mp4Regex = /(.?)\.(mp4)/gm;

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to="/kittens">Kitten Critic</Link>
        </h1>

        <p>{user.email}</p>
        <div className="flex items-center gap-4">
          <Link to="/leaderboard">Leaderboard</Link>
          <Form action="/logout" method="post">
            <button
              type="submit"
              className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
            >
              Logout
            </button>
          </Form>
        </div>
      </header>

      <main className="mt-8 flex min-h-full flex-col items-center bg-white">
        <div className="grid h-96 w-96 max-w-xl justify-center">
          {displayedKittens.map((image, index) => (
            <motion.div
              drag
              key={image.id}
              className="grid h-96 w-96 max-w-xl justify-center overflow-hidden rounded-md bg-white p-2 shadow-md"
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              style={{ x, rotate: rotateValue }}
              onDragEnd={(_, info) => {
                if (info.offset.x >= 200) {
                  voteUp();
                } else if (info.offset.x <= -200) {
                  voteDown();
                }
              }}
            >
              {mp4Regex.test(image.link) ? (
                <video
                  src={image.link}
                  autoPlay
                  loop
                  controls
                  className="col-start-1 row-start-1 h-full w-full rounded-md"
                />
              ) : (
                <img
                  src={image.link}
                  height="auto"
                  alt={image.title}
                  className="col-start-1 row-start-1 h-full w-full rounded-md object-contain object-center"
                  draggable="true"
                  onDragStart={(e) => e.preventDefault()}
                />
              )}
              <motion.svg
                className="col-start-1 row-start-1 h-full w-full object-contain object-center"
                viewBox="0 0 50 50"
                style={{ opacity: svgOpacity }}
              >
                <motion.path
                  fill="none"
                  strokeWidth="2"
                  stroke={color}
                  d="M 0, 20 a 20, 20 0 1,0 40,0 a 20, 20 0 1,0 -40,0"
                  style={{ translateX: 5, translateY: 5 }}
                />
                <motion.path
                  fill="none"
                  strokeWidth="2"
                  stroke={color}
                  d="M14,26 L 22,33 L 35,16"
                  strokeDasharray="0 1"
                  style={{ pathLength: tickPath }}
                />
                <motion.path
                  fill="none"
                  strokeWidth="2"
                  stroke={color}
                  d="M17,17 L33,33"
                  strokeDasharray="0 1"
                  style={{ pathLength: crossPathA }}
                />
                <motion.path
                  fill="none"
                  strokeWidth="2"
                  stroke={color}
                  d="M33,17 L17,33"
                  strokeDasharray="0 1"
                  style={{ pathLength: crossPathB }}
                />
              </motion.svg>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex w-96 justify-around">
          <button
            className="h-12 w-12 rounded-md rounded-full bg-gradient-to-br from-red-200 to-white text-red-600 shadow-md"
            onClick={voteDown}
          >
            ????
          </button>
          <button
            className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-white"
            onClick={voteUp}
          >
            ??????
          </button>
        </div>
      </main>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}
