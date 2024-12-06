import { z } from "zod";

export const SignInSchema = z.object({
  code: z.string(),
  remember: z.boolean().default(true).optional(),
});

export type SignInFormType = z.infer<typeof SignInSchema>;
