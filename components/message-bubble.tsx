"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Props = {
  role: "user" | "assistant";
  content: string;
};

// [text](url) と 裸のURL を <a> に変換する
function renderWithLinks(text: string) {
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|(https?:\/\/\S+)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const url = match[2] ?? match[3];
    const label = match[1] ?? match[3];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800 break-all"
      >
        {label}
      </a>
    );
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts;
}

export default function MessageBubble({ role, content }: Props) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-white border border-gray-200 px-4 py-2.5 text-sm text-gray-800 shadow-sm">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <Avatar size="default" className="shrink-0">
        <AvatarImage src="/zundamon.png" alt="ずんだもん" />
        <AvatarFallback>Z</AvatarFallback>
      </Avatar>
      <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-green-200 px-4 py-2.5 text-sm text-gray-800 shadow-sm whitespace-pre-wrap">
        {content === "" ? (
          <div className="flex gap-1 items-center h-5">
            <span className="size-2 rounded-full bg-green-600 animate-bounce [animation-delay:-0.3s]" />
            <span className="size-2 rounded-full bg-green-600 animate-bounce [animation-delay:-0.15s]" />
            <span className="size-2 rounded-full bg-green-600 animate-bounce" />
          </div>
        ) : (
          renderWithLinks(content)
        )}
      </div>
    </div>
  );
}
