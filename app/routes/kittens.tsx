import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useFetcher, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { createVote } from "~/models/vote.server";

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
  await requireUserId(request);
  var myHeaders = new Headers();
  myHeaders.append("Authorization", "Client-ID 834aeea9283216e");

  var requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow" as RequestRedirect,
  };

  const response = await (
    await fetch(
      "https://api.imgur.com/3/gallery/r/kittens/time/week/1",
      requestOptions
    )
  ).json();
  const images = response.data;

  return json<LoaderData>({ images });
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

export default function NotesPage() {
  const data = useLoaderData() as LoaderData;
  const fetcher = useFetcher();
  const user = useUser();
  const [kittensToVoteOn, setKittensToVoteOn] = useState(data.images);
  const displayedKittens = kittensToVoteOn.slice(0, 1);

  async function voteUp() {
    await fetcher.submit(
      { url: displayedKittens[0].link, up: "up" },
      { method: "post" }
    );
    setKittensToVoteOn(kittensToVoteOn.slice(1, -1));
  }
  async function voteDown() {
    await fetcher.submit({ url: displayedKittens[0].link }, { method: "post" });
    setKittensToVoteOn(kittensToVoteOn.slice(1, -1));
  }

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to=".">Kittens</Link>
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

      <main className="mt-4 flex h-full flex-col items-center bg-white">
        <div className="grid h-96 w-96 max-w-xl justify-center">
          {displayedKittens.map((image, index) => (
            <img
              src={image.link}
              key={image.id}
              height="auto"
              alt={image.title}
              className="col-start-1 row-start-1 h-full w-full object-contain object-center"
            />
          ))}
        </div>
        <button onClick={voteDown}>Down</button>
        <button onClick={voteUp}>Up</button>
      </main>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}
