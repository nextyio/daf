import BaseRedux from '@/model/BaseRedux'

class WalletRedux extends BaseRedux {
  defineTypes () {
    return ['wallet']
  }

  defineDefaultState () {
    return {
      address: null,
      ownersCount: 0,
      owners: null,
      balance: 0,
      ntfBalance: 0,
      required: 0,

      pendingTxCount: 0,
      comfirmedTxCount: 0,
      revertedTxCount: 0,
      pendingTxs: [],
      comfirmedTxs: [],
      revertedTxs: []
    }
  }
}

export default new WalletRedux()
