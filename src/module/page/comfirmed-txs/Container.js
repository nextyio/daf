import { createContainer } from '@/util'
import Component from './Component'
import WalletService from '@/service/WalletService'
var curWallet = null
export default createContainer(Component, (state) => {
  const walletService = new WalletService()
  async function load () {
    walletService.loadTxCounts()
    walletService.loadComfirmedTxs()
  }

  if (state.user.wallet !== curWallet && !curWallet) {
    curWallet = state.user.wallet
    load()
    setInterval(() => {
      load()
    }, 5000)
  }

  return {
    comfirmedTxCount: state.wallet.comfirmedTxCount,
    comfirmedTxs: state.wallet.comfirmedTxs
  }
}, () => {
  return {
  }
})
