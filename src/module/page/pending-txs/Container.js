import { createContainer } from '@/util'
import Component from './Component'
import WalletService from '@/service/WalletService'
var curWallet = null
export default createContainer(Component, (state) => {
  const walletService = new WalletService()
  async function load () {
    walletService.loadPendingTxCount()
    // walletService.loadTxs()
  }

  if (state.user.wallet !== curWallet && !curWallet) {
    curWallet = state.user.wallet
    load()
  }

  return {
    owners: state.wallet.owners,
    pendingTxCount: state.wallet.pendingTxCount,
    pendingTxs: state.wallet.pendingTxs,
    required: state.wallet.required
  }
}, () => {
  const walletService = new WalletService()

  return {
    async execute (txId) {
      return await walletService.execute(txId)
    },
    async confirm (txId) {
      return await walletService.confirm(txId)
    },
    async revoke (txId) {
      return await walletService.revoke(txId)
    },
    async getConfirmationNames (confirmations) {
      return await walletService.getConfirmationNames(confirmations)
    }

  }
})
