"use client";

import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  onSend: (content: string) => void;
  disabled: boolean;
};

export default function InputBar({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3 flex gap-2">
      <Input
        className="flex-1 h-10 text-sm"
        placeholder="メッセージを入力するのだ..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
      />
      <Button
        size="default"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="shrink-0 bg-green-500 hover:bg-green-600 text-white border-0"
      >
        送信
      </Button>
    </div>
  );
}
