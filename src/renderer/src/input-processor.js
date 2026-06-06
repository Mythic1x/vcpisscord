/* eslint-disable @typescript-eslint/explicit-function-return-type */

class InputProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.bufferSize = 960
    this.buffer = new Float32Array(this.bufferSize)
    this.currentIndex = 0
    this.updateInterval = 50
    this.volume = 0
    this.framesSinceLastUpdate = 0
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  process(inputs, outputs, parameters) {
    const input = inputs[0]
    if (!input || input.length === 0) return true
    const channel = input[0]
    let sumSquares = 0
    for (let i = 0; i < channel.length; i++) {
      this.buffer[this.currentIndex] = channel[i]
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      sumSquares += channel[i] * channel[i]
      this.currentIndex += 1
      if (this.currentIndex >= this.bufferSize) {
        this.port.postMessage({ type: 'buffer', buffer: this.buffer }, [this.buffer.buffer])
        this.currentIndex = 0
        this.buffer = new Float32Array(this.bufferSize)
      }
    }


    const rms = Math.sqrt(sumSquares / channel.length)

    // Smooth the volume (decaying by 5% per block instead of per sample)
    this.volume = Math.max(rms, this.volume * 0.95)

    // 3. Handle the 50ms Volume Update Interval manually
    this.framesSinceLastUpdate += channel.length

    // sampleRate is a built-in global variable in AudioWorklets (usually 44100 or 48000)
    // 50ms = 0.05 seconds
    const framesPerUpdate = 48000 * 0.05

    if (this.framesSinceLastUpdate >= framesPerUpdate) {
      this.port.postMessage({ type: 'volume', volume: this.volume })
      // Subtract the threshold instead of resetting to 0 to prevent timing drift
      this.framesSinceLastUpdate -= framesPerUpdate
    }
    return true
  }
}

registerProcessor('input-processor', InputProcessor)
