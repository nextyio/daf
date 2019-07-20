import { createContainer } from '@/util'
import Component from './Component'
// import NTFToken from '@/service/NTFToken'
import NtfTokenService from '@/service/contracts/NtfTokenService'
import UserService from '@/service/UserService'
import WalletService from '@/service/WalletService'
var curWallet = null
export default createContainer(Component, (state) => {
  const userService = new UserService()
  const ntfTokenService = new NtfTokenService()
  const walletService = new WalletService()
  async function load () {
    // walletService.loadAddress()
    // walletService.loadBalance()
    // walletService.loadNtfBalance()
    // walletService.loadRequired()
    // walletService.loadOwners()
    // walletService.loadPendingTxCount()
    // walletService.loadExecutedTxCount()
    // walletService.loadTxs()
  }

  if (state.user.wallet !== curWallet && !curWallet) {
    curWallet = state.user.wallet
    load()
    // setInterval(() => {
    //   load()
    // }, 5000)
  }

  return {

  }
}, () => {
  const ntfTokenService = new NtfTokenService()
  const walletService = new WalletService()

  return {
    async loadNtfPool (_poolAddress) {
      return await walletService.loadNtfPool(_poolAddress)
    }
  }
})
