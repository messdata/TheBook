// "use client";

// import { SessionProvider } from "next-auth/react";
// import { ThemeProvider } from "next-themes";
// import { RosterProvider } from "@/app/context/RosterContext";

// export function Providers({ children }: { children: React.ReactNode }) {
//   return (
//     <SessionProvider>
//       <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
//         {/* RosterProvider is now inside SessionProvider, so useSession() works! */}
//         <RosterProvider>
//           {children}
//         </RosterProvider>
//       </ThemeProvider>
//     </SessionProvider>
//   );
// }