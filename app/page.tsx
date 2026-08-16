import type { Metadata } from "next";
import { HomeTogetherApp } from "./HomeTogetherApp";

export const metadata: Metadata = {
  title: "本周",
  description: "一起安排、完成和回顾家里的大小事。",
};

export default function Home() {
  return <HomeTogetherApp />;
}
