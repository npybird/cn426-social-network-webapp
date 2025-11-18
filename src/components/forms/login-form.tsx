"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { getMyRooms, login } from "@/lib/api";                       // POST /auth/login -> { token, user }
import { loginSchema, type LoginValues } from "@/lib/validators"; // likely { username, password }

export function LoginForm() {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { username: "", password: "" },
    });

    const onSubmit = async (values: LoginValues) => {
        try {
            // backend expects "emailOrUsername"
            const { token, user } = await login({
                emailOrUsername: values.username,
                password: values.password,
            });

            // store auth for the app (JWT + user)
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            // fetch rooms
            const rooms = await getMyRooms();

            if (rooms.length === 0) {
                alert("No rooms found for this user");
                return;
            }

            const firstRoom = rooms[0];

            router.push(`/chat/${firstRoom.roomId}`);
        } catch (err) {
            let serverMsg = "Something went wrong";
            const anyErr: any = err;
            if (anyErr?.response?.data) {
                // axios-like error shape
                serverMsg = anyErr.response.data.message ?? anyErr.response.data.error ?? serverMsg;
            } else if (anyErr?.data) {
                // custom error shape
                serverMsg = anyErr.data.message ?? anyErr.data.error ?? serverMsg;
            } else if (anyErr?.message) {
                serverMsg = anyErr.message;
            }

            // This is a form-level error (invalid credentials), not a field-level one
            setError("root", { type: "server", message: serverMsg });
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <Card className="overflow-hidden p-0 bg-[#7EB6FF]">
                <CardContent className="grid p-0 md:grid-cols-2">
                    {/* left illustration panel (kept as-is) */}
                    <div className="bg-white relative hidden md:block">
                        <img
                            src="/full-logo.png"
                            alt="logo"
                            className="absolute inset-0 h-full w-full object-contain dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>

                    {/* right form */}
                    <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">Welcome back!</h1>
                                <p className="text-gray-600">Login to your account</p>
                            </div>

                            {errors.root?.message && (
                                <p className="rounded-md bg-red-200/90 px-3 py-2 text-sm text-red-700">
                                    {errors.root.message as string}
                                </p>
                            )}

                            <div className="grid gap-3">
                                <Label htmlFor="username">Username or Email</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="your username or email"
                                    className="bg-[#EDF0F5]"
                                    {...register("username")}
                                />
                                {errors.username && (
                                    <p className="text-sm text-red-600">{errors.username.message}</p>
                                )}
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
                                {errors.password && (
                                    <p className="text-sm text-red-600">{errors.password.message}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Signing in..." : "Login"}
                            </Button>

                            <div className="text-center text-sm">
                                Don&apos;t have an account?{" "}
                                <a href="/register" className="underline underline-offset-4">
                                    Sign up
                                </a>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="text-muted-foreground text-center text-xs">
                By clicking continue, you agree to our{" "}
                <a href="#" className="underline underline-offset-4">
                    Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="underline underline-offset-4">
                    Privacy Policy
                </a>
                .
            </div>
        </div>
    );
}
