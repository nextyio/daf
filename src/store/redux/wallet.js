import BaseRedux from '@/model/BaseRedux'

class WalletRedux extends BaseRedux {
  defineTypes () {
    return ['wallet']
  }

  defineDefaultState () {
    return {
      address: null,

      deployedAt: 0,
      ownersCount: 0,
      owners: null,
      balance: 0,
      share: 0,
      ntfBalance: 0,
      required: 0,

      ERC20Address: null,
      ERC20Balance: 0,
      ERC20Share: 0,
      ERC20Decimal: 18,
      ERC20Name: '',

      pendingTxCount: 0,
      executedTxCount: 0,
      pendingTxs: [],
      executedTxs: []
    }
  }
}

export default new WalletRedux()
