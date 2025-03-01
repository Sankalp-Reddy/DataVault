import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 w-full items-center justify-between border-b px-4 md:px-6">
      <title>DataVault</title>
        <Link href="/" className="flex items-center gap-2 font-semibold">
          DataVault
        </Link>
        <nav className="flex gap-4">
          <Link
            href="https://github.com/Sankalp-Reddy/DataVault"
            target="_blank"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            View on GitHub
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Secure Text Vaults That Self-Destruct
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Encrypted, timed storage
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <form className="flex flex-col gap-2 min-[400px]:flex-row" action="/access">
                  <Input className="max-w-lg flex-1" placeholder="Enter your vault key" name="key" required />
                  <Button type="submit">
                    Access Vault
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  New user? Any unique key combination creates your encrypted vault.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Military-Grade Security</h2>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    AES-256 encrypted storage with automatic data shredding the moment your expiration timer completes.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Custom Expiration</h2>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    Set precise expiration windows from 60 minutes to 7 days. Your vault permanently locks when time expires.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">One-Click Access</h2>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    Access via unique URL or key. Edit with secure credentials. Ideal for API keys, credentials, and sensitive sharing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex h-14 w-full items-center justify-between border-t px-4 md:px-6">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 DataVault. All rights reserved.</p>
      </footer>
    </div>
  )
}

