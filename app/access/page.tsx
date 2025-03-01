"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getData, saveData, type StoredData, type RetentionPeriod, RETENTION_PERIODS } from "@/lib/firebase"

// Helper function to check if data is expired
const isDataExpired = (expiresAt: number) => {
  return Date.now() >= expiresAt
}

// Helper function to format retention period
const formatRetentionPeriod = (period: RetentionPeriod): string => {
  return period
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace("hours", " Hours")
    .replace("hour", " Hour")
    .replace("days", " Days")
    .replace("week", " Week")
}

export default function AccessPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<StoredData | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editKey, setEditKey] = useState("")
  const [text, setText] = useState("")
  const [newEditKey, setNewEditKey] = useState("")
  const [retentionPeriod, setRetentionPeriod] = useState<RetentionPeriod>("24hours")
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const accessKey = searchParams.get("key") || ""

  useEffect(() => {
    async function fetchData() {
      if (!accessKey) {
        setIsLoading(false)
        return
      }

      try {
        const fetchedData = await getData(accessKey)
        if (fetchedData) {
          setData(fetchedData)
          setText(fetchedData.text)
        } else {
          setData(null)
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        })
        setData(null)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [accessKey, toast])

  const handleCreateStorage = async () => {
    if (!newEditKey.trim()) {
      toast({
        title: "Edit Key Required",
        description: "Please enter an edit key for your storage.",
        variant: "destructive",
      })
      return
    }

    if (!accessKey) {
      toast({
        title: "Access Key Required",
        description: "An access key is required to create storage.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const now = Date.now()
      const newData: StoredData = {
        text: "",
        editKey: newEditKey.trim(),
        accessKey: accessKey,
        createdAt: now,
        retentionPeriod,
        expiresAt: now + RETENTION_PERIODS[retentionPeriod],
      }

      await saveData(newData)
      setData(newData)
      setText("")
      setEditMode(true)
      setIsCreating(false)
      setNewEditKey("")
      toast({
        title: "Storage Created",
        description: "Your storage has been created successfully. Keep your edit key safe!",
      })
    } catch (error) {
      console.error("Error creating storage:", error)
      toast({
        title: "Error",
        description: "Failed to create storage. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditKeySubmit = () => {
    if (data && editKey === data.editKey) {
      setEditMode(true)
    } else {
      toast({
        title: "Invalid Edit Key",
        description: "The edit key you entered is incorrect.",
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    if (!data || !accessKey) return

    if (isDataExpired(data.expiresAt)) {
      toast({
        title: "Storage Expired",
        description: "This storage has expired and can no longer be modified.",
        variant: "destructive",
      })
      setEditMode(false)
      return
    }

    setIsSaving(true)

    try {
      const updatedData: StoredData = {
        ...data,
        text: text || "",
      }

      // Optimistic update
      setData(updatedData)

      await saveData(updatedData)

      setEditMode(false)
      toast({
        title: "Changes Saved",
        description: "Your data has been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving data:", error)
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      })
      // Revert optimistic update
      const originalData = await getData(accessKey)
      if (originalData) {
        setData(originalData)
        setText(originalData.text)
      }
    } finally {
      setIsSaving(false)
    }
  }

  function RemainingTime({ expiresAt }: { expiresAt: number }) {
    const [timeLeft, setTimeLeft] = useState("Calculating...")

    useEffect(() => {
      const calculateTimeLeft = () => {
        const now = Date.now()
        const diff = expiresAt - now

        if (diff <= 0) {
          return "Expired"
        }

        const days = Math.floor(diff / (24 * 60 * 60 * 1000))
        const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
        const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))

        if (days > 0) {
          return `${days}d ${hours}h remaining`
        }
        if (hours > 0) {
          return `${hours}h ${minutes}m remaining`
        }
        return `${minutes}m remaining`
      }

      setTimeLeft(calculateTimeLeft())

      const interval = setInterval(() => {
        setTimeLeft(calculateTimeLeft())
      }, 60000)

      return () => clearInterval(interval)
    }, [expiresAt])

    return <div className="text-sm text-muted-foreground">{timeLeft}</div>
  }

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 py-8">
      <header><title>DataVault</title></header>
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" className="text-sm font-medium hover:underline">
          ← Back to Home
        </Link>
        {data && !editMode && (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Enter edit key"
              value={editKey}
              onChange={(e) => setEditKey(e.target.value)}
            />
            <Button onClick={handleEditKeySubmit}>Edit</Button>
          </div>
        )}
      </div>

      {!data ? (
        <div className="rounded-lg border p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">No Data Found</h2>
          {!isCreating ? (
            <>
              <p className="mb-6 text-gray-500">Would you like to create new storage with this access key?</p>
              <Button onClick={() => setIsCreating(true)}>Create Storage</Button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-500">
                Enter an edit key for your storage. Keep this key safe - you'll need it to make changes later.
              </p>
              <div className="mx-auto max-w-sm space-y-4">
                <Input
                  type="text"
                  placeholder="Enter your edit key"
                  value={newEditKey}
                  onChange={(e) => setNewEditKey(e.target.value)}
                />
                <div className="space-y-2">
                  <Label>Retention Period</Label>
                  <Select
                    value={retentionPeriod}
                    onValueChange={(value) => setRetentionPeriod(value as RetentionPeriod)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select retention period" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(RETENTION_PERIODS) as RetentionPeriod[]).map((period) => (
                        <SelectItem key={period} value={period}>
                          {formatRetentionPeriod(period)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false)
                      setNewEditKey("")
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateStorage} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Storage"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Retention Period: {formatRetentionPeriod(data.retentionPeriod)}
            </div>
            <RemainingTime expiresAt={data.expiresAt} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text">Text Content</Label>
            <Textarea
              id="text"
              placeholder="Enter your text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!editMode}
              className="min-h-[200px]"
            />
          </div>

          {editMode && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

