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
    walletService.loadAddress()
    walletService.loadBalance()
    walletService.loadNtfBalance()
    walletService.loadRequired()
    walletService.loadOwners()
    walletService.loadPendingTxCount()
    walletService.loadExecutedTxCount()
    walletService.loadTxs()
    walletService.loadMyWallets()
  }

  if (state.user.wallet !== curWallet && !curWallet) {
    curWallet = state.user.wallet
    load()
    // setInterval(() => {
    //   load()
    // }, 5000)
  }

  return {
    address: state.wallet.address,
    balance: state.wallet.balance,
    ntfBalance: state.wallet.ntfBalance,
    required: state.wallet.required,
    ownersCount: state.wallet.ownersCount,
    owners: state.wallet.owners,

    pendingTxCount: state.wallet.pendingTxCount,
    executedTxCount: state.wallet.executedTxCount
  }
}, () => {
  const ntfTokenService = new NtfTokenService()
  const walletService = new WalletService()

  return {
    async transferNtf (to, amount, description) {
      return await walletService.transferNtf(to, amount, description)
    },
    async transferNty (to, amount, description) {
      return await walletService.transferNty(to, amount, description)
    },
    async create( owners, required) {
      return await walletService.create(owners, required)
    }
  }
})
