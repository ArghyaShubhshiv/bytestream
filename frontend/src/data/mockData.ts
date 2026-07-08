export type Role = "creator" | "learner";

export interface Creator {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  subscribers: number;
  isSubscribed?: boolean;
}

export interface Video {
  id: string;
  title: string;
  creator: string;
  creatorAvatar: string;
  thumbnail: string;
  duration: string;
  views?: number;
  likes?: number;
  comments?: number;
  status?: "published" | "draft";
}

export interface Activity {
  id: string;
  type: "liked" | "commented" | "uploaded" | "subscribed" | "saved";
  text: string;
  target: string;
  timeAgo: string;
}

export interface Profile {
  username: string;
  handle: string;
  role: Role;
  bio: string;
  avatar: string;
  stats: {
    likes: number;
    saved: number;
    subscribers: number;
    uploads: number;
  };
}

const thumbs = (seed: string, hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='hsl(${hue},80%,55%)'/><stop offset='100%' stop-color='hsl(${(hue+40)%360},75%,40%)'/></linearGradient></defs><rect width='320' height='180' fill='url(%23g)'/><text x='50%' y='52%' fill='white' font-family='Inter,sans-serif' font-size='22' font-weight='700' text-anchor='middle' opacity='0.9'>${seed}</text></svg>`
  )}`;

const avatar = (name: string, hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' rx='40' fill='hsl(${hue},70%,55%)'/><text x='50%' y='56%' fill='white' font-family='Inter' font-size='32' font-weight='700' text-anchor='middle'>${name[0]}</text></svg>`
  )}`;

export const mockProfile: Profile = {
  username: "Alex Rivera",
  handle: "@alexbuilds",
  role: "creator",
  bio: "Frontend engineer turned educator. Teaching React, design systems, and the craft of shipping.",
  avatar: avatar("Alex", 187),
  stats: { likes: 1284, saved: 96, subscribers: 14820, uploads: 32 },
};

export const mockLiked: Video[] = [
  { id: "l1", title: "Mastering CSS Grid in 12 Minutes", creator: "Lina Chen", creatorAvatar: avatar("Lina", 220), thumbnail: thumbs("CSS Grid", 200), duration: "12:04" },
  { id: "l2", title: "The State of TypeScript 2026", creator: "Marc Holt", creatorAvatar: avatar("Marc", 280), thumbnail: thumbs("TypeScript", 240), duration: "23:47" },
  { id: "l3", title: "Designing Calm Interfaces", creator: "Yui Tanaka", creatorAvatar: avatar("Yui", 160), thumbnail: thumbs("Calm UI", 170), duration: "08:21" },
  { id: "l4", title: "Vite Internals, Explained", creator: "Diego Reyes", creatorAvatar: avatar("Diego", 30), thumbnail: thumbs("Vite", 50), duration: "17:55" },
];

export const mockSaved: Video[] = [
  { id: "s1", title: "Building a Design System from Scratch", creator: "Priya Sen", creatorAvatar: avatar("Priya", 320), thumbnail: thumbs("Design Sys", 320), duration: "41:12" },
  { id: "s2", title: "React Server Components Demystified", creator: "Marc Holt", creatorAvatar: avatar("Marc", 280), thumbnail: thumbs("RSC", 260), duration: "29:08" },
  { id: "s3", title: "Animating with Framer Motion", creator: "Yui Tanaka", creatorAvatar: avatar("Yui", 160), thumbnail: thumbs("Motion", 140), duration: "14:30" },
];

export const mockUploads: Video[] = [
  { id: "u1", title: "Shipping a SaaS in 30 Days — Day 1", creator: "Alex Rivera", creatorAvatar: avatar("Alex", 187), thumbnail: thumbs("SaaS Day 1", 187), duration: "18:22", views: 12480, likes: 842, comments: 96, status: "published" },
  { id: "u2", title: "Refactoring a Legacy React App", creator: "Alex Rivera", creatorAvatar: avatar("Alex", 187), thumbnail: thumbs("Refactor", 210), duration: "26:04", views: 8214, likes: 511, comments: 47, status: "published" },
  { id: "u3", title: "Notes on a New Editor (WIP)", creator: "Alex Rivera", creatorAvatar: avatar("Alex", 187), thumbnail: thumbs("Editor WIP", 60), duration: "09:18", views: 0, likes: 0, comments: 0, status: "draft" },
];

export const mockSubscribers: Creator[] = [
  { id: "c1", name: "Lina Chen", handle: "@linacodes", avatar: avatar("Lina", 220), subscribers: 24800, isSubscribed: true },
  { id: "c2", name: "Marc Holt", handle: "@marc.ts", avatar: avatar("Marc", 280), subscribers: 58200, isSubscribed: true },
  { id: "c3", name: "Yui Tanaka", handle: "@yuidesigns", avatar: avatar("Yui", 160), subscribers: 11400, isSubscribed: true },
  { id: "c4", name: "Diego Reyes", handle: "@diego.dev", avatar: avatar("Diego", 30), subscribers: 7320, isSubscribed: true },
];

export const mockActivity: Activity[] = [
  { id: "a1", type: "liked", text: "You liked", target: "Mastering CSS Grid in 12 Minutes", timeAgo: "2h ago" },
  { id: "a2", type: "uploaded", text: "You published", target: "Refactoring a Legacy React App", timeAgo: "1d ago" },
  { id: "a3", type: "commented", text: "You commented on", target: "The State of TypeScript 2026", timeAgo: "2d ago" },
  { id: "a4", type: "subscribed", text: "You subscribed to", target: "Yui Tanaka", timeAgo: "4d ago" },
  { id: "a5", type: "saved", text: "You saved", target: "Building a Design System from Scratch", timeAgo: "1w ago" },
];

export const mockRecommended: Video[] = [
  { id: "r1", title: "Edge Functions: Patterns That Scale", creator: "Priya Sen", creatorAvatar: avatar("Priya", 320), thumbnail: thumbs("Edge Fns", 290), duration: "21:40" },
  { id: "r2", title: "A Pragmatic Guide to Testing UI", creator: "Lina Chen", creatorAvatar: avatar("Lina", 220), thumbnail: thumbs("Testing UI", 110), duration: "33:11" },
  { id: "r3", title: "Tailwind in Large Codebases", creator: "Diego Reyes", creatorAvatar: avatar("Diego", 30), thumbnail: thumbs("Tailwind", 20), duration: "15:02" },
  { id: "r4", title: "From Designer to Engineer", creator: "Yui Tanaka", creatorAvatar: avatar("Yui", 160), thumbnail: thumbs("D→E", 150), duration: "11:48" },
];

export function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}
