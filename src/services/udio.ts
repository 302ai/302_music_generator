import { apiKy } from "@/api";
import { EditFormSchemaType } from "@/components/forms/tabs/schema";
import { store } from "@/stores";
import { udioAdvancedAtom } from "@/stores/slices/udio_advanced_store";
import { createScopedLogger } from "@/utils";
import { z } from "zod";

const logger = createScopedLogger("UdioService");

export const SubmitUdioMusicResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.string(),
});

type SubmitUdioMusicResponse = z.infer<typeof SubmitUdioMusicResponseSchema>;

export const submitUdioMusic = async (formData: EditFormSchemaType) => {
  const isCustom = formData.custom;
  const udioAdvancedData = store.get(udioAdvancedAtom);
  let data = {};
  if (isCustom) {
    data = {
      gen_params: {
        prompt: formData.style,
        lyrics: formData.lyrics,
        lyrics_type: formData.pure ? "instrumental" : "user",
        model_type: formData.model,
        config: {
          mode: "regular",
        },
        negative_prompt: udioAdvancedData.negativePrompt,
        song_section_start: 0,
        song_section_end: 1,
        lyrics_placement_start: 0,
        lyrics_placement_end: 1,
        prompt_strength: udioAdvancedData.promptStrength,
        clarity_strength: udioAdvancedData.clarityStrength,
        lyrics_strength: udioAdvancedData.lyricsStrength,
        generation_quality: udioAdvancedData.quality,
        seed: -1,
        bypass_prompt_optimization: false,
      },
    };
  } else {
    data = {
      gen_params: {
        prompt: formData.musicDescription,
        lyrics_type: formData.pure ? "instrumental" : "generate",
        model_type: formData.model,
        config: {
          mode: "regular",
        },
        negative_prompt: udioAdvancedData.negativePrompt,
        song_section_start: 0,
        song_section_end: 1,
        lyrics_placement_start: 0,
        lyrics_placement_end: 1,
        prompt_strength: udioAdvancedData.promptStrength,
        clarity_strength: udioAdvancedData.clarityStrength,
        lyrics_strength: udioAdvancedData.lyricsStrength,
        generation_quality: udioAdvancedData.quality,
        seed: -1,
        bypass_prompt_optimization: false,
      },
    };
  }

  logger.debug("Submit Udio Music data:", data);

  return await apiKy
    .post("udio/generate-proxy", {
      json: data,
    })
    .json<SubmitUdioMusicResponse>();
};

export const UdioMusicDataSchema = z.object({
  created_at: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  duration: z.number().nullable(),
  generation_id: z.string().nullable(),
  id: z.string().nullable(),
  image_path: z.string().nullable(),
  lyrics: z.string().nullable(),
  song_path: z.string().nullable(),
  title: z.string().nullable(),
});

export type UdioMusicData = z.infer<typeof UdioMusicDataSchema>;

export const QueryUdioTaskStatusResponseSchema = z.object({
  code: z.union([z.string(), z.number()]),
  message: z.string(),
  data: z
    .object({
      action: z.string().optional(),
      data: z
        .union([
          z.array(
            z.object({
              songs: z.array(UdioMusicDataSchema).nullable(),
            })
          ),
          z.array(
            z.object({
              songs: z.undefined(),
            })
          ),
        ])
        .nullish(),
      fail_reason: z.string().optional(),
      progress: z.string().optional(),
      status: z.string().optional(),
      task_id: z.string(),
    })
    .nullable(),
});

type QueryUdioTaskStatusResponse = z.infer<
  typeof QueryUdioTaskStatusResponseSchema
>;

export const isUdioTaskComplete = (
  response: QueryUdioTaskStatusResponse
): boolean => {
  const data = QueryUdioTaskStatusResponseSchema.parse(response);
  logger.debug("Udio task data:", data);

  if (data.data?.status === "PROCESSING") {
    return false;
  }

  return (
    (data.data?.data?.length || 0) > 0 &&
    (data.data?.data?.every(
      (item) =>
        "songs" in item &&
        item.songs?.every(
          (song: UdioMusicData) => song.duration !== null && song.duration > 0
        )
    ) ||
      false)
  );
};

export const queryUdioTaskStatus = async (taskId?: string) => {
  logger.debug("Querying udio music task status:", taskId);
  return await apiKy
    .get(`udio/query?ids=${taskId}`)
    .json<QueryUdioTaskStatusResponse>();
};
