"use client";

import { createContext, useContext } from "react";
import type { Question, QL } from "@/lib/guide";
import type { Action, State } from "@/lib/store";

export type Ctx = {
  s: State;
  dispatch: (a: Action) => void;
  questions: Question[];
  nums: Record<string, string>;
  ql: QL;
  total: number;
  pending: string[];
};

export const AppCtx = createContext<Ctx | null>(null);

export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
};

/** Plain <img> so the SVG keeps its own width/height from the Figma export. */
export const Icon = ({ name, className }: { name: string; className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={`/icons/${name}.svg`} alt="" className={className} draggable={false} />
);
