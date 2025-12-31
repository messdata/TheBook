import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const tomorrowDay = tomorrow.getDay()
    const todayDate = today.getDate() // 1-31
    const tomorrowDate = tomorrow.getDate()

    console.log('🔍 Checking pay day notifications...', {
      todayDay,
      tomorrowDay,
      todayDate,
      tomorrowDate,
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString()
    })

    // Fetch all users with their pay settings
    const { data: users, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, first_name, pay_frequency, pay_day_weekly, pay_day_monthly, pay_start_date')
      .not('pay_frequency', 'is', null)

    if (fetchError) {
      console.error('Error fetching users:', fetchError)
      throw fetchError
    }

    console.log(`📊 Found ${users?.length || 0} users with pay settings`)

    let notificationsCreated = 0

    for (const user of users || []) {
      const notifications = []

      // WEEKLY PAY DAY
      if (user.pay_frequency === 'weekly') {
        // Tomorrow is pay day
        if (tomorrowDay === user.pay_day_weekly) {
          notifications.push({
            user_id: user.user_id,
            type: 'payday_reminder',
            title: 'Pay Day Tomorrow! 💰',
            message: `Hi ${user.first_name}, your weekly pay day is tomorrow!`,
            read: false,
          })
        }
        // Today is pay day
        if (todayDay === user.pay_day_weekly) {
          notifications.push({
            user_id: user.user_id,
            type: 'payday',
            title: 'Got Paid? 🎉',
            message: `Hi ${user.first_name}, today is your pay day!`,
            read: false,
          })
        }
      }

      // FORTNIGHTLY PAY DAY
      if (user.pay_frequency === 'fortnightly' && user.pay_start_date) {
        const payStartDate = new Date(user.pay_start_date)
        payStartDate.setHours(0, 0, 0, 0)

        const todayNormalized = new Date(today)
        todayNormalized.setHours(0, 0, 0, 0)

        // Calculate weeks since the reference pay date
        const weeksSinceStart = Math.floor(
          (todayNormalized.getTime() - payStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
        )

        // Check if this week is a pay week (every other week = even weeks)
        const isPayWeek = weeksSinceStart % 2 === 0

        console.log(`📅 Fortnightly check for ${user.first_name}:`, {
          payStartDate: user.pay_start_date,
          weeksSinceStart,
          isPayWeek,
          payDayWeekly: user.pay_day_weekly
        })

        if (isPayWeek) {
          // Tomorrow is pay day
          if (tomorrowDay === user.pay_day_weekly) {
            notifications.push({
              user_id: user.user_id,
              type: 'payday_reminder',
              title: 'Pay Day Tomorrow! 💰',
              message: `Hi ${user.first_name}, your fortnightly pay day is tomorrow!`,
              read: false,
            })
          }

          // Today is pay day
          if (todayDay === user.pay_day_weekly) {
            notifications.push({
              user_id: user.user_id,
              type: 'payday',
              title: 'Got Paid? 🎉',
              message: `Hi ${user.first_name}, today is your fortnightly pay day!`,
              read: false,
            })
          }
        }
      }

      // MONTHLY PAY DAY
      if (user.pay_frequency === 'monthly') {
        // Tomorrow is pay day
        if (tomorrowDate === user.pay_day_monthly) {
          notifications.push({
            user_id: user.user_id,
            type: 'payday_reminder',
            title: 'Pay Day Tomorrow! 💰',
            message: `Hi ${user.first_name}, your monthly pay day is tomorrow!`,
            read: false,
          })
        }
        // Today is pay day
        if (todayDate === user.pay_day_monthly) {
          notifications.push({
            user_id: user.user_id,
            type: 'payday',
            title: 'Got Paid? 🎉',
            message: `Hi ${user.first_name}, today is your pay day!`,
            read: false,
          })
        }
      }

      // Insert notifications if any
      if (notifications.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('notifications')
          .insert(notifications)

        if (insertError) {
          console.error(`❌ Error creating notifications for user ${user.user_id}:`, insertError)
        } else {
          notificationsCreated += notifications.length
          console.log(`✅ Created ${notifications.length} notification(s) for ${user.first_name}`)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Checked ${users?.length || 0} users, created ${notificationsCreated} notifications`,
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