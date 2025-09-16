import { z } from "zod";

export const loginSchema = z.object({
    username: z.string().min(3, "กรุณากรอกอย่างน้อย 3 ตัวอักษร"),
    password: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัวอักษร"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
    .object({
        email: z.string().email("อีเมลไม่ถูกต้อง"),
        username: z.string().min(3, "กรุณากรอกอย่างน้อย 3 ตัวอักษร"),
        password: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัวอักษร"),
        confirmPassword: z.string().min(6),
    })
    .refine((d) => d.password === d.confirmPassword, {
        path: ["confirmPassword"],
        message: "รหัสผ่านไม่ตรงกัน",
    });

export type RegisterValues = z.infer<typeof registerSchema>;
