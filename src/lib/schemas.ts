import { z } from "zod";
import { Year } from "@prisma/client";

export const signupSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 characters"),
    college: z.string().default("Silicon Institute of Technology, Sambalpur"),
    sic: z.string().min(8, "SIC must be at least 8 characters"),
    year: z.enum(["FIRST_YEAR", "SECOND_YEAR", "THIRD_YEAR", "FOURTH_YEAR"]),
    imageUrl: z.string().optional(),
    eventParticipation: z.number().default(0),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  })
  .transform((data) => ({
    ...data,
    name: `${data.firstName} ${data.lastName}`
  }));

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  sic: z.string().regex(/^[0-9]{7}$/, "SIC must be 7 digits"),
  year: z.nativeEnum(Year, {
    errorMap: () => ({ message: "Please select a valid year" }),
  }),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  managedEvents: z.array(z.string()).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UserFormData = z.infer<typeof userFormSchema>;
