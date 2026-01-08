import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import WalletClient from "./WalletClient";

// export default async function WalletPage() {
//   // Check authentication
//   const { data: { session } } = await supabase.auth.getSession();

//   if (!session) {
//     redirect("/login");
//   }

//   return <WalletClient />;
// }

export default function WalletPage() {
  return <WalletClient />;
}