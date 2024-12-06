import { apiKy } from "@/api";
import { EditFormSchemaType } from "@/components/forms/tabs/schema";
import { createScopedLogger } from "@/utils";
import { fromUnixTime } from "date-fns";
import { z } from "zod";

const logger = createScopedLogger("SunoAPI");
export const ResponseSchema = z.object({
  data: z.object({
    text: z.string(),
    title: z.string(),
  }),
  msg: z.string(),
  code: z.number(),
});

export type Response = z.infer<typeof ResponseSchema>;

export const generateLyrics = async (prompt: string) => {
  return await apiKy
    .post("suno/submit/lyrics", {
      json: {
        prompt,
      },
    })
    .json<Response>();
};

export const SunoMusicDataSchema = z.object({
  audio_url: z.string().nullable(),
  clip_id: z.string().nullable(),
  continue_at: z.number().nullable(),
  continue_clip_id: z.string().nullable(),
  create_time: z
    .string()
    .nullable()
    .transform((val) => (val ? fromUnixTime(Number(val)) : null)),
  duration: z
    .string()
    .nullable()
    .transform((val) => (val && val !== "0" ? Number(val) : null)),
  gpt_description_prompt: z.string().nullable(),
  image_large_url: z.string().nullable(),
  image_url: z.string().nullable(),
  msg: z.string().nullable(),
  mv: z.string().nullable(),
  prompt: z.string().nullable(),
  state: z.string().nullable(),
  status: z.string().nullable(),
  tags: z.string().nullable(),
  task_id: z.string().nullable(),
  title: z.string().nullable(),
  update_time: z
    .string()
    .nullable()
    .transform((val) =>
      val && val !== "0" ? fromUnixTime(Number(val)) : null
    ),
  video_url: z.string().nullable(),
});

export type SunoMusicData = z.infer<typeof SunoMusicDataSchema>;

export const QuerySunoTaskStatusResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  progress: z.string(),
  data: z.object({
    data: z.array(SunoMusicDataSchema),
    status: z.string(),
    task_id: z.string(),
  }),
});

export type QuerySunoTaskStatusResponse = z.infer<
  typeof QuerySunoTaskStatusResponseSchema
>;

export const isSunoTaskComplete = (
  response: QuerySunoTaskStatusResponse
): boolean => {
  const data = QuerySunoTaskStatusResponseSchema.parse(response);
  logger.debug("Suno task data:", data);
  return (
    data.data.data.length > 0 &&
    data.data.data.every((item) => item.duration !== null)
  );
};

export const querySunoTaskStatus = async (taskId?: string) => {
  logger.debug("Querying suno music task status:", taskId);
  return await apiKy
    .get(`suno/fetch/${taskId}`)
    .json<QuerySunoTaskStatusResponse>();
};

export const SubmitSunoMusicResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.string(),
});

type SubmitSunoMusicResponse = z.infer<typeof SubmitSunoMusicResponseSchema>;

export const submitSunoMusic = async (formData: EditFormSchemaType) => {
  const isCustom = formData.custom;

  let data = {};
  if (isCustom) {
    data = {
      prompt: formData.lyrics,
      tags: formData.style,
      mv: formData.model,
      title: formData.title,
      make_instrumental: formData.pure,
    };
  } else {
    if (formData.pure) {
      data = {
        gpt_description_prompt: formData.musicDescription,
        tags: formData.musicDescription,
        mv: formData.model,
        make_instrumental: formData.pure,
      };
    } else {
      data = {
        gpt_description_prompt: formData.musicDescription,
        mv: formData.model,
        make_instrumental: formData.pure,
      };
    }
  }

  return await apiKy
    .post("suno/submit/music", {
      json: data,
    })
    .json<SubmitSunoMusicResponse>();
};
