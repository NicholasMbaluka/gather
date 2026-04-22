'use client'

import { AlertCircle, CheckCircle2, Database, Key, ExternalLink, Sparkles } from 'lucide-react'

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-brand text-white text-sm font-medium mb-6">
            <Sparkles size={16} />
            Gatherly Setup
          </div>
          <h1 className="font-display text-4xl font-bold mb-3">
            Welcome to Gatherly
          </h1>
          <p className="text-muted-foreground text-lg">
            Let&apos;s get your event platform connected to Supabase
          </p>
        </div>

        {/* Setup Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          {/* Alert */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl mb-6">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">Supabase Connection Required</h3>
              <p className="text-amber-800 dark:text-amber-200 text-sm mt-1">
                Gatherly needs Supabase for authentication and data storage. Follow the steps below to connect.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg">Setup Steps</h2>
            
            {/* Step 1 */}
            <div className="flex gap-4 p-4 bg-secondary/50 rounded-xl">
              <div className="w-8 h-8 rounded-full gradient-brand text-white flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Create a Supabase Project</h3>
                <p className="text-muted-foreground text-sm mb-2">
                  If you haven&apos;t already, create a free Supabase project at supabase.com
                </p>
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary text-sm font-medium hover:underline"
                >
                  Open Supabase Dashboard
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 p-4 bg-secondary/50 rounded-xl">
              <div className="w-8 h-8 rounded-full gradient-brand text-white flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Get Your API Credentials</h3>
                <p className="text-muted-foreground text-sm mb-2">
                  Go to Project Settings &rarr; API in your Supabase dashboard
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Database size={14} className="text-muted-foreground" />
                    <code className="bg-muted px-2 py-0.5 rounded text-xs">NEXT_PUBLIC_SUPABASE_URL</code>
                    <span className="text-muted-foreground">- Project URL</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Key size={14} className="text-muted-foreground" />
                    <code className="bg-muted px-2 py-0.5 rounded text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                    <span className="text-muted-foreground">- anon/public key</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 p-4 bg-secondary/50 rounded-xl">
              <div className="w-8 h-8 rounded-full gradient-brand text-white flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Add Environment Variables</h3>
                <p className="text-muted-foreground text-sm mb-2">
                  In v0, click the <strong>Settings</strong> button (top right) &rarr; <strong>Vars</strong> and add both variables.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4 p-4 bg-secondary/50 rounded-xl">
              <div className="w-8 h-8 rounded-full gradient-brand text-white flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Run the Database Schema</h3>
                <p className="text-muted-foreground text-sm mb-2">
                  In your Supabase SQL Editor, run the SQL from <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/supabase/schema.sql</code>
                </p>
              </div>
            </div>
          </div>

          {/* After setup */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 size={16} className="text-green-500" />
              After adding the environment variables, refresh this page to continue
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-sm mt-6">
          Need help? Check the README.md file for detailed setup instructions.
        </p>
      </div>
    </div>
  )
}
