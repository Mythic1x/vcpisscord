import { ElectronAPI } from '@electron-toolkit/preload'
interface TCPSocketApi {
  onTcpData: (callback) => void
  sendTcpData: (data) => void
}
declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    tcpSocket: TCPSocketApi
  }
}
