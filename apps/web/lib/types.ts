import z from "zod"

export const CreateUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    username: z.string().min(3).max(20),
    name: z.string().optional(),
    photo: z.string().optional(),
})


export const SigninSchema = z.object({
    username: z.string(),
    password: z.string(),
})

export const CreateRoomSchema = z.object({
    slug: z.string(),
    adminId: z.string(),
})

export const CreateShapeSchema = z.object({
    type: z.string(),   // "rect", "circle", "line", etc.
    x: z.number(),
    y: z.number(),
    strokeColor: z.string(),
    strokeWidth: z.number(),
    fillColor: z.string(),
    details: z.string(),
    roomId: z.string().optional(),
    createdBy: z.string(),
    isPersonal: z.boolean().optional().default(false)
})