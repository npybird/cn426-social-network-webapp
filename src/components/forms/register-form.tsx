"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signup } from "@/lib/api";  // matches backend /auth/signup
import { registerSchema, type RegisterValues } from "@/lib/validators";

export function RegisterForm() {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            username: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: RegisterValues) => {
        try {
            const { email, username, password } = values;

            // frontend ensures confirmPassword matches, backend only sees password
            await signup({ email, username, password });

            // redirect to login after success
            router.push("/login");
        } catch (err: any) {
            const msg = err?.message ?? "Registration failed";
            setError("email", { message: msg });
            setError("username", { message: msg });
            setError("password", { message: msg });
            setError("confirmPassword", { message: msg });
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <Card className="overflow-hidden p-0 bg-[#7EB6FF]">
                <CardContent className="grid p-0 md:grid-cols-2">
                    {/* left panel */}
                    <div className="bg-muted relative hidden md:block">
                        <img
                            src="/placeholder.svg"
                            alt="illustration"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>

                    {/* form */}
                    <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">Create Account</h1>
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your email"
                                    className="bg-[#EDF0F5]"
                                    {...register("email")}
                                />
                                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="your username"
                                    className="bg-[#EDF0F5]"
                                    {...register("username")}
                                />
                                {errors.username && <p className="text-sm text-red-600">{errors.username.message}</p>}
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="your password"
                                    className="bg-[#EDF0F5]"
                                    {...register("password")}
                                />
                                {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="confirm your password"
                                    className="bg-[#EDF0F5]"
                                    {...register("confirmPassword")}
                                />
                                {errors.confirmPassword && (
                                    <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Creating..." : "Register"}
                            </Button>

                            <div className="text-center text-sm">
                                Already have an account?{" "}
                                <a href="/login" className="underline underline-offset-4">
                                    Login
                                </a>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="text-muted-foreground text-center text-xs">
                By clicking continue, you agree to our{" "}
                <a className="underline underline-offset-4" href="#">Terms of Service</a>{" "}
                and{" "}
                <a className="underline underline-offset-4" href="#">Privacy Policy</a>.
            </div>
        </div>
    );
}
