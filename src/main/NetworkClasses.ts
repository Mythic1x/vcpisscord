import { BTreeMap } from "btreemap"

/* eslint-disable @typescript-eslint/no-unused-vars */
class Connection {
  latency: number
  packetLoss: number
  jitterBuffer: JitterBuffer
  constructor() {
    this.latency = 0
    this.packetLoss = 0
    this.jitterBuffer = new JitterBuffer()
  }
}

class NetworkSnapshot {
  packetsReceived: number
  highestPacket: bigint
  constructor(packetsReceived, highestPacket) {
    this.packetsReceived = packetsReceived
    this.highestPacket = highestPacket
  }
}

class JitterBuffer {
  buffer: BTreeMap<Uint8Array>
  lastPopped: bigint
  highestPacket: bigint
  totalReceivedPackets: number
  snapshots: NetworkSnapshot[]

  constructor() {
    this.buffer = new BTreeMap()
    this.lastPopped = 0n
    this.totalReceivedPackets = 0
    this.highestPacket = 0n
    this.snapshots = []
  }
}
