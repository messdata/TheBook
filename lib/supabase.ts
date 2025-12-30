import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) {
                // Get cookie from document.cookie
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(';').shift();
            },
            set(name: string, value: string, options: any) {
                // Set cookie with proper options
                let cookie = `${name}=${value}; path=/`;
                if (options?.maxAge) cookie += `; max-age=${options.maxAge}`;
                if (options?.domain) cookie += `; domain=${options.domain}`;
                if (options?.path) cookie += `; path=${options.path}`;
                if (options?.sameSite) cookie += `; samesite=${options.sameSite}`;
                document.cookie = cookie;
            },
            remove(name: string, options: any) {
                // Remove cookie by setting expiry to past
                let cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                if (options?.domain) cookie += `; domain=${options.domain}`;
                document.cookie = cookie;
            },
        },
    })
}

// Export a singleton instance
export const supabase = createClient()
