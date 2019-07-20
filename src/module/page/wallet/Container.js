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
    walletService.loadAddress(null)
    walletService.loadBalance()
    walletService.loadNtfBalance()
    walletService.loadRequired()
    walletService.loadOwners()
    walletService.loadPendingTxCount()
    walletService.loadExecutedTxCount()
    walletService.loadTxs()
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
    share: state.wallet.ownersCount ? (state.wallet.balance / state.wallet.ownersCount).toFixed(0) : 0,
    ERC20Address: state.wallet.ERC20Address,
    ERC20Name: state.wallet.ERC20Name,
    ERC20Decimal: state.wallet.ERC20Decimal,
    ERC20Balance: state.wallet.ERC20Balance,
    ERC20Share: (state.wallet.ownersCount) ? (state.wallet.ERC20Balance / state.wallet.ownersCount).toFixed(0) : 0,

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
    async distributeCoin () {
      return await walletService.distributeCoin()
    },
    async distributeERC20 (_tokenAddress) {
      return await walletService.distributeERC20(_tokenAddress)
    },

    async loadNtfPool (_poolAddress) {
      return await walletService.loadNtfPool(_poolAddress)
    }
  }
})
