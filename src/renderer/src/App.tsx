/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from 'react'
import workletUrl from './input-processor.js?worker&url'
const context = new AudioContext({ sampleRate: 48000 })
function App(): React.JSX.Element {
  const encoder = useRef<AudioEncoder>(null)
  const audioStream = useRef<MediaStream>(null)
  const [isMuted, setMuted] = useState(false)
  const socket = window.tcpSocket
  const startInputStream = async (): Promise<void> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 48000, channelCount: 1, echoCancellation: false }
    })
    audioStream.current = stream

    let timestamp = 0
    let packetNr: bigint = 0n
    const textEncoder = new TextEncoder()
    const audioEncoder = new AudioEncoder({
      output: (chunk) => {
        const buffer = new ArrayBuffer(chunk.byteLength)
        console.log(chunk.byteLength)
        chunk.copyTo(buffer)
        const opusBytes = new Uint8Array(buffer)
        const packetBuffer = new ArrayBuffer(25 + chunk.byteLength)
        const view = new DataView(packetBuffer)
        const string = 'PACKET/'
        const encodedString = textEncoder.encode(string)
        for (let i = 0; i < string.length; i++) {
          view.setUint8(i, encodedString[i])
        }
        view.setBigUint64(7, packetNr, false)
        packetNr++
        view.setBigInt64(15, BigInt(Date.now()), false)
        view.setUint16(23, chunk.byteLength, false)
        const payloadView = new Uint8Array(packetBuffer, 25)
        payloadView.set(opusBytes)


        socket.sendTcpData(new Uint8Array(packetBuffer))
      },
      error: (err) => {
        console.error(err)
      }
    })
    audioEncoder.configure({
      codec: 'opus',
      sampleRate: 48000,
      numberOfChannels: 1,
      bitrate: 64000,
      //@ts-ignore typescript not typing things properly
      opus: {"signal": "voice", useinbandfec: true}
    })



    const source = context.createMediaStreamSource(stream)
    await context.audioWorklet.addModule(workletUrl)
    const inputNode = new AudioWorkletNode(context, 'input-processor')
    source.connect(inputNode)
    inputNode.port.onmessage = (event) => {
      const message = event.data
      switch (message.type) {
        case 'buffer': {
          const audioData = new AudioData({
            format: 'f32-planar',
            sampleRate: 48000,
            timestamp: timestamp,
            numberOfChannels: 1,
            data: message.buffer,
            numberOfFrames: 960
          })
          timestamp += 20000
          audioEncoder.encode(audioData)
          audioData.close()
          break
        }
        case 'volume':
          //todo
          break
      }
    }
  }
  return (
    <>
      <button className="stream" onClick={startInputStream}>
        Start stream
      </button>
      <button
        className="mute"
        onClick={() => {
          if (!audioStream.current) return
          const track = audioStream.current.getAudioTracks()[0]
          track.enabled = !track.enabled
          setMuted(prev => !prev)
        }}
      >
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
    </>
  )
}

export default App
