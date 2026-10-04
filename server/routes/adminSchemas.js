import { z } from "zod";

export const empty = z.object({}).optional().default({});

export function requestSchema({ body = empty, params = empty, query = empty } = {}) {
  return z.object({ body, params, query });
}

export const idParam = (key) =>
  z.object({
    [key]: z.string().trim().min(2).max(80),
  });

export const listQuery = z
  .object({
    page: z.coerce.number().int().optional(),
    limit: z.coerce.number().int().optional(),
    q: z.string().max(80).optional(),
    eventId: z.string().max(80).optional(),
    status: z.string().max(40).optional(),
    bookingStatus: z.string().max(40).optional(),
    paymentStatus: z.string().max(40).optional(),
    method: z.string().max(20).optional(),
    from: z.string().max(40).optional(),
    to: z.string().max(40).optional(),
    minAmount: z.coerce.number().optional(),
    maxAmount: z.coerce.number().optional(),
    range: z.string().max(20).optional(),
    type: z.string().max(20).optional(),
  })
  .strip();

export const eventBody = z
  .object({
    eventId: z.string().max(80).optional(),
    slug: z.string().max(80).optional(),
    number: z.string().max(40).optional(),
    title: z.string().max(140).optional(),
    location: z.string().max(120).optional(),
    date: z.string().max(40).optional(),
    startTime: z.string().max(20).optional(),
    endTime: z.string().max(20).optional(),
    price: z.coerce.number().optional(),
    capacity: z.coerce.number().int().optional(),
    description: z.string().max(2000).optional(),
    image: z.string().max(300).optional(),
    status: z.string().max(20).optional(),
    inclusions: z.union([z.array(z.string().max(80)).max(20), z.string().max(2000)]).optional(),
  })
  .strip();
