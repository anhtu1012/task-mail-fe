import { useEffect, useState } from "react";

export function useBroadcastChannel<T>(channelName: string) {
  const [message, setMessage] = useState<T | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const channel = new BroadcastChannel(channelName);

    const handleMessage = (event: MessageEvent) => {
      setMessage(event.data);
    };

    channel.addEventListener("message", handleMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, [channelName]);

  const sendMessage = (data: T) => {
    if (typeof window !== "undefined") {
      const channel = new BroadcastChannel(channelName);
      channel.postMessage(data);
    }
  };

  return { message, sendMessage };
}
