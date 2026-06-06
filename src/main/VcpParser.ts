type VCPHeader = 'CALL' | 'PACKET' | 'ACCEPTCALL' | 'DECLINECALL'
interface VCPPacketMessage {
  packetNr: bigint
  timestamp: bigint
  dataLen: number
  data: Uint8Array
  type: 'PACKET'
}
interface VCPActionMessage {
  ip: string
  port: number
  mimetype: string
  username: string
  type: Exclude<VCPHeader, 'PACKET'>
}

export function parseVcp(data: Buffer<ArrayBuffer>): VCPPacketMessage | VCPActionMessage | string {
  if (data.toString('utf-8', 0, 7) === 'PACKET/') {
    try {
      const msg = data.subarray(7)
      const packetNumber = msg.readBigUInt64BE(0)
      const timestamp = msg.readBigInt64BE(8)
      const dataLen = msg.readUInt16BE(16)
      if (dataLen + 18 > msg.length) {
        return 'Malformed Packet: Size too big'
      }
      const bytes = new Uint8Array(msg.subarray(18, 18 + dataLen))
      const parsedMessage: VCPPacketMessage = {
        type: 'PACKET',
        packetNr: packetNumber,
        timestamp: timestamp,
        dataLen: dataLen,
        data: bytes
      }
      return parsedMessage
    } catch (err) {
      console.log(err)
      return 'Malformed Packet'
    }
  } else {
    try {
      const args = data.toString('utf-8').trim().split(' ')
      const header = args[0]
      if (!isValidHeader(header) || header === 'PACKET') {
        return 'Malformed Packet: Invalid Header'
      }
      const parsedMessage: VCPActionMessage = {
        type: header,
        ip: args[1],
        port: parseInt(args[2]),
        mimetype: args[3],
        username: args.slice(4).join(' ')
      }
      return parsedMessage
    } catch (err) {
      console.log(err)
      return 'Malformed Packet'
    }
  }
}

function isValidHeader(header: string): header is VCPHeader {
  const validHeaders = ['CALL', 'PACKET', 'ACCEPTCALL', 'DECLINECALL']
  return validHeaders.includes(header)
}
