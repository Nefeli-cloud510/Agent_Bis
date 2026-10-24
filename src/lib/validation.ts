import { z } from "zod";
import { ALL_QUESTION_IDS } from "@/config/content";

const positiveInteger = z.number().int().min(0).max(86_400_000 * 3);

const timingSchema = z.object({
  consent_active_ms: positiveInteger.optional(),
  history_active_ms: positiveInteger.optional(),
  permission_active_ms: positiveInteger.nullish(),
  task_active_ms: positiveInteger.optional(),
  recommendation_active_ms: positiveInteger.optional(),
  questionnaire_active_ms: positiveInteger.optional(),
});

const pageVisitSchema = z.object({
  page: z.enum([
    "consent",
    "history",
    "permission",
    "task",
    "recommendation",
    "questionnaire",
    "done",
  ]),
  enteredAt: z.string().max(80).optional(),
  leftAt: z.string().max(80).optional(),
  activeMs: positiveInteger.optional(),
});

export const submitBodySchema = z
  .object({
    answers: z
      .object(
        Object.fromEntries(
          ALL_QUESTION_IDS.map((id) => [id, z.number().int().min(1).max(5)])
        )
      )
      .strict(),
    timings: timingSchema.optional(),
    pageVisits: z.array(pageVisitSchema).max(300).optional(),
    idempotencyKey: z.string().min(8).max(80).optional(),
  })
  .strict();

export type SubmitBody = z.infer<typeof submitBodySchema>;

export const loginBodySchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});
