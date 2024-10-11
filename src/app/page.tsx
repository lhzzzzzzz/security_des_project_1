'use client'

import React, { useState } from 'react'
import { getDESCipherText, getDESPlainText, binaryToString } from '../utils/des'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// console.log(binaryToString("0100010001000101010100110011000100110010001100110011010000110101"))

export default function App() {
  const [isEncrypting, setIsEncrypting] = useState(true)
  const [input, setInput] = useState('DES12345')
  const [key, setKey] = useState('12345678')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const handleConvert = () => {
    setError('')
    if (!key || key.length > 32) {
      setError('密钥不能为空且长度不能超过32')
      return
    }

    try {
      if (isEncrypting) {
        setResult(getDESCipherText(input, key))
      } else {
        setResult(getDESPlainText(input, key))
      }
    } catch (err) {
      setError('处理过程中出现错误，请检查输入')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">DES 加密/解密</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="mode-switch">模式：{isEncrypting ? '加密' : '解密'}</Label>
              <Switch
                id="mode-switch"
                checked={isEncrypting}
                onCheckedChange={setIsEncrypting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="input">输入</Label>
              <Input
                id="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isEncrypting ? "明文" : "密文"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">密钥</Label>
              <Input
                id="key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="密钥 (不超过32位)"
              />
            </div>

            <Button onClick={handleConvert} className="w-full">
              {isEncrypting ? '加密' : '解密'}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="result">结果</Label>
              <Input
                id="result"
                value={result}
                readOnly
                placeholder={isEncrypting ? "密文" : "明文"}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}