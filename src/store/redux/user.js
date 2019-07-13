import BaseRedux from '@/model/BaseRedux'

class UserRedux extends BaseRedux {
  defineTypes () {
    return ['user']
  }

  defineDefaultState () {
    return {
      is_login: false,
      is_admin: false,

      login_form: {
        privatekey: '',
        loading: false
      },

      web3: null,
      blockNumber: 0,
      wallet: null,
      balance: 0,
      ntfBalance: 0,
      ntfDeposited: 0,
      rewardBalance: 0,
      isLocking: false,
      unlockTime: 0,
      loginMetamask: true,
      myPendingOutAmount: 0
    }
  }
}

export default new UserRedux()
