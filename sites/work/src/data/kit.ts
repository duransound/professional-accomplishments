import { z } from "zod";
import { loadContent, required } from "./load";

const schema = z.object({
  groups: z
    .array(
      z.object({
        label: required("A group label"),
        items: z
          .array(required("Each item"))
          .min(1, { message: "needs at least one item listed under it" }),
      })
    )
    .min(1, { message: "needs at least one group" }),
});

export const kit = loadContent("kit.yaml", schema).groups;
