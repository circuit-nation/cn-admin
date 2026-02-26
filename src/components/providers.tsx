"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

type ProvidersProps = {
	children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
	return (
		<QueryProvider>
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
				disableTransitionOnChange
			>
				<TooltipProvider>
					<ConvexClientProvider>{children}</ConvexClientProvider>
				</TooltipProvider>
			</ThemeProvider>
			<Toaster />
		</QueryProvider>
	);
}
