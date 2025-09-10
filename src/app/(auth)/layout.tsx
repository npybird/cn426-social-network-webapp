export default function AuthLayout({
    children,
}: { children: React.ReactNode }) {
    return (
        <main className="min-h-dvh flex flex-col">
            {children}
        </main>
    )
}