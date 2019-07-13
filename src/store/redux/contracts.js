import BaseRedux from '@/model/BaseRedux'

class ContractRedux extends BaseRedux {
  defineTypes () {
    return ['contracts']
  }

  defineDefaultState () {
    return {
      web3: null,
      ntfToken: null,
      nextyGovernance: null,
      walletPro: null
    }
  }
}

export default new ContractRedux()
