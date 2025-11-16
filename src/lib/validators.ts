import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3, "Please enter at least 3 characters"),
  password: z.string().min(6, "Please enter at least 6 characters"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email eddress"),
    username: z.string().min(3, "Please enter at least 3 characters"),
    password: z.string().min(6, "Please enter at least 6 characters"),
    confirmPassword: z.string().min(6, "Please enter at least 6 characters"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type RegisterValues = z.infer<typeof registerSchema>;
