import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { getLeaderboardKittens } from "~/models/vote.server";

import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

type LoaderData = {
  url: string;
  _count: {
    up: number;
  };
}[];

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request);

  const response = await await getLeaderboardKittens();

  const images: LoaderData = response;

  return json<LoaderData>(images);
};

export default function LeaderboardPage() {
  const images = useLoaderData() as LoaderData;
  const user = useUser();

  const mp4Regex = /(.?)\.(mp4)/gm;

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to="/kittens">Kitten Critic</Link>
        </h1>
        <p>{user.email}</p>
        <Form action="/logout" method="post">
          <button
            type="submit"
            className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
          >
            Logout
          </button>
        </Form>
      </header>

      <main className="grid grid-cols-4 bg-white">
        {images.map((image, index) => (
          <div key={index} className="relative">
            <div className=" absolute top-4 left-4 rounded-md bg-white p-2 shadow-md">
              {image._count.up}👍
            </div>
            {mp4Regex.test(image.url) ? (
              <video src={image.url} autoPlay loop />
            ) : (
              <img
                src={image.url}
                height="auto"
                alt="kitten"
                loading="lazy"
                className="h-full w-full object-contain object-center"
              />
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
