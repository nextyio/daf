import { createContainer } from '@/util'
import Component from './Component'
import WalletService from '@/service/WalletService'
var curWallet = null
export default createContainer(Component, (state) => {
  const walletService = new WalletService()
  async function load () {
    walletService.loadExecutedTxCount()
    // walletService.loadTxs()
  }

  if (state.user.wallet !== curWallet && !curWallet) {
    curWallet = state.user.wallet
    load()
  }

  return {
    executedTxCount: state.wallet.executedTxCount,
    executedTxs: state.wallet.executedTxs
  }
}, () => {
  return {
  }
})
