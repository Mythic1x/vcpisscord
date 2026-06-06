import FastPriorityQueue from 'fastpriorityqueue'

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
  constructor(packetsReceived, highestPacket: bigint) {
    this.packetsReceived = packetsReceived
    this.highestPacket = highestPacket
  }
}

class JitterBuffer {
  buffer: FastPriorityQueue<Packet>
  lastPopped: bigint
  highestPacket: bigint
  totalReceivedPackets: number
  snapshots: NetworkSnapshot[]
  queuedPacketNumbers: Set<bigint>
  snapshotInterval: NodeJS.Timeout

  constructor() {
    this.buffer = new FastPriorityQueue((a, b) => a.packetNr < b.packetNr)
    this.lastPopped = 0n
    this.totalReceivedPackets = 0
    this.highestPacket = 0n
    this.snapshots = []
    this.queuedPacketNumbers = new Set()
    this.snapshotInterval = setInterval(() => {
      this.takeSnapshot()
    }, 1000)
  }

  takeSnapshot(): void {
    if (this.snapshots.length >= 10) {
      this.snapshots.shift()
    }
    this.snapshots.push(new NetworkSnapshot(this.totalReceivedPackets, this.highestPacket))
  }

  addPacket(packet: Packet): void {
    if (packet.packetNr > this.highestPacket) {
      this.highestPacket = packet.packetNr
    }
    if (!this.queuedPacketNumbers.has(packet.packetNr)) {
      this.queuedPacketNumbers.add(packet.packetNr)
      this.buffer.add(packet)
      this.totalReceivedPackets++
    }
  }

  calculatePacketLoss(): number {
    if (this.snapshots.length < 2) return 0.0

    const currentSnapshot = this.snapshots[this.snapshots.length - 1]
    const oldestSnapshot = this.snapshots[0]

    if (currentSnapshot.highestPacket === oldestSnapshot.highestPacket) {
      return 0.0
    }

    const highest = Number(currentSnapshot.highestPacket)
    const lowest = Number(oldestSnapshot.highestPacket)

    const expectedPackets = Math.max(0, highest - lowest)
    const receivedPackets = Math.max(0, currentSnapshot.packetsReceived - oldestSnapshot.packetsReceived)

    const lostPackets = Math.max(0, expectedPackets - receivedPackets)

    if (expectedPackets === 0) return 0.0

    const packetLossRatio = lostPackets / expectedPackets
    return packetLossRatio * 100.0
  }

  popPacket(): Uint8Array | null {
    if (this.buffer.isEmpty()) {
      return null
    }
    const packet = this.buffer.poll()
    if (!packet) return null
    if (this.queuedPacketNumbers.has(packet.packetNr)) {
      this.queuedPacketNumbers.delete(packet.packetNr)
    }
    this.lastPopped = packet.packetNr
    return packet.packetData
  }
}

interface Packet {
  packetNr: bigint
  packetData: Uint8Array
}
