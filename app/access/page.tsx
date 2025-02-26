"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload } from "lucide-react"
import Link from "next/link"

interface StoredData {
  text: string
  files: string[]
  editKey: string
  accessKey: string
  createdAt: number
}

// Move the isDataExpired function outside the component
const isDataExpired = (timestamp: number) => {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  return Date.now() - timestamp > TWENTY_FOUR_HOURS
}

export default function AccessPage() {
  const searchParams = useSearchParams();
  // const accessKey = searchParams.get("key") || "";
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<StoredData | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editKey, setEditKey] = useState("")
  const [text, setText] = useState("")
  const [files, setFiles] = useState<string[]>([])
  const [newEditKey, setNewEditKey] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const accessKey = searchParams?.get("key") || ""

  useEffect(() => {
    if (!accessKey) {
      setIsLoading(false)
      return
    }

    try {
      const storedData = localStorage.getItem(`data-${accessKey}`)
      if (storedData) {
        const parsedData = JSON.parse(storedData) as StoredData

        if (isDataExpired(parsedData.createdAt)) {
          localStorage.removeItem(`data-${accessKey}`)
          setData(null)
          toast({
            title: "Storage Expired",
            description: "This storage has expired after 24 hours.",
            variant: "destructive",
          })
        } else {
          setData(parsedData)
          setText(parsedData.text || "")
          setFiles(Array.isArray(parsedData.files) ? parsedData.files : [])
        }
      } else {
        setData(null)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setData(null)
    }

    setIsLoading(false)
  }, [accessKey, toast])

  const handleCreateStorage = () => {
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

    const newData: StoredData = {
      text: "",
      files: [],
      editKey: newEditKey.trim(),
      accessKey: accessKey,
      createdAt: Date.now(),
    }

    try {
      localStorage.setItem(`data-${accessKey}`, JSON.stringify(newData))
      setData(newData)
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

  const handleSave = () => {
    if (!data || !accessKey) return

    if (isDataExpired(data.createdAt)) {
      toast({
        title: "Storage Expired",
        description: "This storage has expired and can no longer be modified.",
        variant: "destructive",
      })
      setEditMode(false)
      return
    }

    const updatedData: StoredData = {
      ...data,
      text: text || "",
      files: files || [],
    }

    try {
      localStorage.setItem(`data-${accessKey}`, JSON.stringify(updatedData))
      setData(updatedData)
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
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files
    if (!uploadedFiles) return

    const filePromises = Array.from(uploadedFiles).map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve(reader.result as string)
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(filePromises).then((results) => {
      setFiles([...files, ...results])
    })
  }

  // Separate component for remaining time display
  function RemainingTime({ createdAt }: { createdAt: number }) {
    const [timeLeft, setTimeLeft] = useState("Calculating...")

    useEffect(() => {
      const calculateTimeLeft = () => {
        const now = Date.now()
        const expiresAt = createdAt + 24 * 60 * 60 * 1000
        const diff = expiresAt - now

        if (diff <= 0) {
          return "Expired"
        }

        const hours = Math.floor(diff / (60 * 60 * 1000))
        const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
        return `${hours}h ${minutes}m remaining`
      }

      // Initial calculation
      setTimeLeft(calculateTimeLeft())

      // Set up interval
      const interval = setInterval(() => {
        setTimeLeft(calculateTimeLeft())
      }, 60000)

      // Clean up
      return () => clearInterval(interval)
    }, [createdAt])

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
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false)
                      setNewEditKey("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateStorage}>Create Storage</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {data && (
            <div className="flex justify-end">
              <RemainingTime createdAt={data.createdAt} />
            </div>
          )}

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

          <div className="space-y-2">
            <Label>Files</Label>
            {editMode && (
              <div className="mb-4">
                <Input type="file" multiple onChange={handleFileUpload} className="cursor-pointer" />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {files.map((file, index) => {
                const isImage = file.startsWith("data:image")
                return (
                  <div key={index} className="relative rounded-lg border bg-gray-100 p-2">
                    {isImage ? (
                      <img
                        src={file || "/placeholder.svg"}
                        alt={`Uploaded file ${index + 1}`}
                        className="aspect-video w-full rounded object-cover"
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    {editMode && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute right-2 top-2"
                        onClick={() => setFiles(files.filter((_, i) => i !== index))}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {editMode && (
            <div className="flex justify-end">
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

