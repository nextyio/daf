import { createContainer } from '@/util'
import Component from './Component'
import WalletService from '@/service/WalletService'
var curWallet = null
export default createContainer(Component, (state) => {
  const walletService = new WalletService()
  async function load () {
    walletService.loadTxCounts()
    walletService.loadPendingTxs()
  }

  if (state.user.wallet !== curWallet && !curWallet) {
    curWallet = state.user.wallet
    load()
    setInterval(() => {
      load()
    }, 5000)
  }

  return {
    pendingTxCount: state.wallet.pendingTxCount,
    pendingTxs: state.wallet.pendingTxs
  }
}, () => {
  const walletService = new WalletService()

  return {
    async comfirm (txId) {
      return await walletService.comfirm(txId)
    },
    async revoke (txId) {
      return await walletService.revoke(txId)
    }

  }
})
