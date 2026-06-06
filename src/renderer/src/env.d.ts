/// <reference types="vite/client" />

type InputMessgae =
| {"type": "buffer", buffer: Float32Array}
| {"type": "volume", volume: number}
