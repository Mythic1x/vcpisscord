import { ElectronAPI } from '@electron-toolkit/preload'
interface UDPSocketApi {
  onUDPMessage: (callback) => void
  sendUDPMessage: (data) => void
}
declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    udpSocket: UDPSocketApi
  }
}
