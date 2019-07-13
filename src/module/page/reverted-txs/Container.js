import { createContainer } from '@/util'
import Component from './Component'
import WalletService from '@/service/WalletService'
var curWallet = null
export default createContainer(Component, (state) => {
  const walletService = new WalletService()
  async function load () {
    walletService.loadTxCounts()
    walletService.loadRevertedTxs()
  }

  if (state.user.wallet !== curWallet && !curWallet) {
    curWallet = state.user.wallet
    load()
    setInterval(() => {
      load()
    }, 5000)
  }

  return {
    revertedTxCount: state.wallet.revertedTxCount,
    revertedTxs: state.wallet.revertedTxs
  }
}, () => {
  return {
  }
})
