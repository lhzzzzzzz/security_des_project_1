'use client'

import React, { useState, useCallback } from 'react'
import { getDESCipherText, getDESPlainText } from '../utils/des'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Upload, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function App() {
  const [isEncrypting, setIsEncrypting] = useState(true)
  const [inputType, setInputType] = useState<'text' | 'file'>('text')
  const [input, setInput] = useState('')
  const [key, setKey] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === "text/plain") {
      setFile(droppedFile)
      const reader = new FileReader()
      reader.onload = (e) => setInput(e.target?.result as string)
      reader.readAsText(droppedFile)
    } else {
      setError('Only.txt files can be uploaded!')
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/plain") {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (e) => setInput(e.target?.result as string)
      reader.readAsText(selectedFile)
    } else {
      setError('Only.txt files can be uploaded!')
    }
  }

  const handleConvert = () => {
    setError('')
    if (!key || key.length > 32) {
      setError('The key cannot be empty and cannot be longer than 32.')
      return
    }

    try {
      if (isEncrypting) {
        setResult(getDESCipherText(input, key))
      } else {
        setResult(getDESPlainText(input, key))
      }
    } catch (err) {
      setError('An error occurred during processing. Please check your input')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">DES Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            className="flex items-center  justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-4">
              <span className={`text-sm ${!isEncrypting ? 'font-bold' : ''}`}>Decrypt</span>
              <Switch
                id="mode-switch"
                checked={isEncrypting}
                onCheckedChange={setIsEncrypting}
              />
              <span className={`text-sm ${isEncrypting ? 'font-bold' : ''}`}>Encrypt</span>
            </div>
          </motion.div>

          <motion.div
            className="space-y-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Label htmlFor="key">KEY</Label>
            <Input
              id="key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Key (no more than 32 bits)"
            />
          </motion.div>

          <motion.div
            className="space-y-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Label htmlFor="input-type">Input Mode</Label>
            <Select onValueChange={(value: 'text' | 'file') => setInputType(value)} value={inputType}>
              <SelectTrigger>
                <SelectValue>{inputType === 'text' ? 'Text Input' : 'File Upload'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Input</SelectItem>
                <SelectItem value="file">File Upload</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          <AnimatePresence mode="wait">
            {inputType === 'text' ? (
              <motion.div
                key="text-input"
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Label htmlFor="input">Input</Label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isEncrypting ? "Plaintext" : "Ciphertext"}
                  className="w-full h-32 p-2 border rounded-md"
                />
              </motion.div>
            ) : (
              <motion.div
                key="file-input"
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Label>File Upload</Label>
                <div
                  className={`border-2 border-dashed rounded-md p-4 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {file ? (
                    <div className="flex items-center justify-between">
                      <span>{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFile(null)
                          setInput('')
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p>Drag and drop files here or</p>
                      <label htmlFor="file-upload" className="cursor-pointer text-blue-500 hover:text-blue-600">
                        click to upload
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".txt"
                        onChange={handleFileChange}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button onClick={handleConvert} className="w-full">
              {isEncrypting ? 'Encrypt' : 'Decrypt'}
            </Button>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="space-y-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Label htmlFor="result">Result</Label>
            <textarea
              id="result"
              value={result}
              readOnly
              placeholder={isEncrypting ? "Ciphertext" : "Plaintext"}
              className="w-full h-32 p-2 border rounded-md"
            />
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}