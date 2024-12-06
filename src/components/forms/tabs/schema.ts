import { z } from "zod";

export const EditFormSchema = z
  .object({
    model: z.string(),
    pure: z.boolean().default(false),
    custom: z.boolean().default(false),
    musicDescription: z.string().max(200).optional(),
    lyrics: z.string().max(3000).optional(),
    style: z.string().max(120).optional(),
    title: z.string().max(80).optional(),
    udioAdvanced: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.custom) {
      if (!data.pure && (!data.lyrics || !data.lyrics.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "lyrics_required",
          path: ["lyrics"],
        });
      }
      if (!data.style || !data.style.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "style_required",
          path: ["style"],
        });
      }
      if (!data.title || !data.title.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "title_required",
          path: ["title"],
        });
      }
    } else {
      if (!data.musicDescription || !data.musicDescription.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "music_description_required",
          path: ["musicDescription"],
        });
      }
    }
  });

export type EditFormSchemaType = z.infer<typeof EditFormSchema>;
// Prompt strength: 0-1
// Lyrics strength: 0-1
// Clarity strength: 0-1
// Negative prompt: string
// Generation quality: 0-1
export const UdioAdvancedFormSchema = z.object({
  promptStrength: z.number().min(0).max(1).default(0.5),
  lyricsStrength: z.number().min(0).max(1).default(0.5),
  clarityStrength: z.number().min(0).max(1).default(0.5),
  negativePrompt: z.string().optional(),
  quality: z.number().min(0).max(1).default(0.75),
});

export type UdioAdvancedFormSchemaType = z.infer<typeof UdioAdvancedFormSchema>;
