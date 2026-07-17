import { AlertProvider } from "@/components/ui/alert-modal";

export const metadata = {
  title: "Admin Panel | AAA Orange",
  description: "Admin dashboard for AAA Orange",
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#ebf4f5]">
      <AlertProvider>{children}</AlertProvider>
    </div>
  );
}
