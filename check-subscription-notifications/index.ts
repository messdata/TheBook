import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Brand logos mapping for popular subscriptions
const BRAND_LOGOS: { [key: string]: string } = {
  netflix: "🎬",
  spotify: "🎵",
  youtube: "📺",
  "youtube premium": "📺",
  disney: "🏰",
  "disney+": "🏰",
  "disney plus": "🏰",
  hbo: "🎭",
  "hbo max": "🎭",
  amazon: "📦",
  "amazon prime": "📦",
  apple: "🍎",
  "apple music": "🍎",
  "apple tv": "🍎",
  "apple tv+": "🍎",
  icloud: "☁️",
  dropbox: "📁",
  "google one": "☁️",
  "google drive": "☁️",
  office: "📊",
  "microsoft 365": "📊",
  adobe: "🎨",
  canva: "🎨",
  figma: "🎨",
  github: "💻",
  notion: "📝",
  evernote: "📝",
  chatgpt: "🤖",
  "chatgpt plus": "🤖",
  openai: "🤖",
  slack: "💬",
  zoom: "📹",
  peloton: "🚴",
  headspace: "🧘",
  calm: "🧘",
  nytimes: "📰",
  "new york times": "📰",
  audible: "🎧",
  kindle: "📚",
  playstation: "🎮",
  "playstation plus": "🎮",
  xbox: "🎮",
  nintendo: "🎮",
  duolingo: "🌍",
  coursera: "🎓",
  linkedin: "💼",
  tinder: "💘",
  bumble: "💘",
}

// Get brand logo/emoji for subscription
function getBrandLogo(subscriptionName: string): string {
  const name = subscriptionName.toLowerCase().trim()
  
  for (const [brand, emoji] of Object.entries(BRAND_LOGOS)) {
    if (name.includes(brand)) {
      return emoji
    }
  }
  
  return "💳"
}

// Calculate next due date for a subscription
function calculateNextDueDate(
  subscription: any,
  fromDate: Date = new Date()
): Date {
  const today = new Date(fromDate)
  today.setHours(0, 0, 0, 0)
  
  let nextDue = new Date(today)
  
  if (subscription.frequency === "monthly") {
    const renewalDay = subscription.renewal_day || today.getDate()
    nextDue.setDate(renewalDay)
    
    // If we've already passed this month's renewal day, move to next month
    if (nextDue <= today) {
      nextDue.setMonth(nextDue.getMonth() + 1)
    }
    
    // Handle edge case: if renewal day doesn't exist in target month
    const targetMonth = nextDue.getMonth()
    nextDue.setDate(renewalDay)
    if (nextDue.getMonth() !== targetMonth) {
      nextDue.setDate(0) // Go to last day of previous month
    }
  } else if (subscription.frequency === "weekly") {
    const renewalDayOfWeek = subscription.renewal_day || today.getDay()
    const currentDayOfWeek = today.getDay()
    
    let daysUntilNext = renewalDayOfWeek - currentDayOfWeek
    if (daysUntilNext <= 0) {
      daysUntilNext += 7
    }
    
    nextDue.setDate(today.getDate() + daysUntilNext)
  }
  
  return nextDue
}

// Get days until a date
function getDaysUntil(targetDate: Date, fromDate: Date = new Date()): number {
  const from = new Date(fromDate)
  from.setHours(0, 0, 0, 0)
  
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  
  const diffTime = target.getTime() - from.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const today = new Date()
    console.log('💳 Checking subscription notifications...', {
      date: today.toISOString()
    })

    // Fetch all active subscriptions
    const { data: subscriptions, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('*, user_profiles!inner(first_name, currency)')
      .eq('is_active', true)

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError)
      throw fetchError
    }

    console.log(`📊 Found ${subscriptions?.length || 0} active subscriptions`)

    let notificationsCreated = 0
    const notificationsByUser = new Map()

    for (const sub of subscriptions || []) {
      const nextDue = calculateNextDueDate(sub, today)
      const daysUntil = getDaysUntil(nextDue, today)
      
      console.log(`📅 ${sub.name} for user ${sub.user_id}:`, {
        nextDue: nextDue.toISOString(),
        daysUntil,
        renewalDay: sub.renewal_day,
        frequency: sub.frequency
      })

      // Check if we should send a notification (7 days or 1 day before)
      if (daysUntil === 7 || daysUntil === 1) {
        const logo = getBrandLogo(sub.name)
        const currency = sub.user_profiles?.currency || 'EUR'
        const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '₹'
        
        // Check if notification already exists
        const { data: existingNotif } = await supabaseAdmin
          .from("notifications")
          .select("id")
          .eq("user_id", sub.user_id)
          .eq("type", "subscription_reminder")
          .eq("metadata->>subscription_id", sub.id)
          .eq("metadata->>due_date", nextDue.toISOString().split('T')[0])
          .eq("metadata->>days_until", daysUntil.toString())
          .maybeSingle()

        // Only create if it doesn't exist
        if (!existingNotif) {
          const firstName = sub.user_profiles?.first_name || 'there'
          const title = daysUntil === 1 ? "Subscription Due Tomorrow! 💳" : "Upcoming Subscription 📅"
          const message = daysUntil === 1 
            ? `Hi ${firstName}, ${logo} ${sub.name} (${currencySymbol}${sub.amount.toFixed(2)}) renews tomorrow`
            : `Hi ${firstName}, ${logo} ${sub.name} (${currencySymbol}${sub.amount.toFixed(2)}) renews in ${daysUntil} days`

          const notification = {
            user_id: sub.user_id,
            type: "subscription_reminder",
            title,
            message,
            read: false,
            metadata: {
              subscription_id: sub.id,
              subscription_name: sub.name,
              amount: sub.amount,
              due_date: nextDue.toISOString().split('T')[0],
              days_until: daysUntil,
              logo: logo
            }
          }

          // Group by user to batch insert
          if (!notificationsByUser.has(sub.user_id)) {
            notificationsByUser.set(sub.user_id, [])
          }
          notificationsByUser.get(sub.user_id).push(notification)
        }
      }
    }

    // Batch insert notifications per user
    for (const [userId, notifications] of notificationsByUser) {
      const { error: insertError } = await supabaseAdmin
        .from('notifications')
        .insert(notifications)

      if (insertError) {
        console.error(`❌ Error creating notifications for user ${userId}:`, insertError)
      } else {
        notificationsCreated += notifications.length
        console.log(`✅ Created ${notifications.length} notification(s) for user ${userId}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Checked ${subscriptions?.length || 0} subscriptions, created ${notificationsCreated} notifications`,
        notificationsCreated,
        timestamp: new Date().toISOString()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})