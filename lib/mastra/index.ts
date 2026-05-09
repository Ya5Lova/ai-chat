import { Mastra } from "@mastra/core";
import { zundamonAgent } from "./agent";

export const mastra = new Mastra({
  agents: { zundamonAgent },
});
