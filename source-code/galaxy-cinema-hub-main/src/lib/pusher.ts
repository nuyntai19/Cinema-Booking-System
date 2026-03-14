import Pusher from "pusher-js";

let pusherInstance: Pusher | null = null;

export const getPusherClient = (): Pusher | null => {
  const key = import.meta.env.VITE_PUSHER_KEY as string | undefined;
  const cluster = import.meta.env.VITE_PUSHER_CLUSTER as string | undefined;

  if (!key || !cluster) {
    return null;
  }

  if (!pusherInstance) {
    pusherInstance = new Pusher(key, {
      cluster,
      forceTLS: true,
    });
  }

  return pusherInstance;
};
