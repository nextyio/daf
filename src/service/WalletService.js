import BaseService from '../model/BaseService'
import { utils } from 'web3'

function fillBytes32 (text) {
  let s = text.split('x')[1]
  let len = s.length
  let toFill = 32 - len
  for (let i = 1; i <= toFill; i++)
      s = '0' + s
  return '0x' + s
}

export default class extends BaseService {
  async loadAddress () {
    const redux = this.store.getRedux('wallet')
    let store = this.store.getState()
    let address = store.contracts.walletPro._address
    await this.dispatch(redux.actions.address_update(address))
  }

  async loadRequired () {
    const redux = this.store.getRedux('wallet')
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let required = await methods.required().call()
    await this.dispatch(redux.actions.required_update(required))
  }

  async loadBalance () {
    const redux = this.store.getRedux('wallet')
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let balance = await methods.getBalance().call()
    await this.dispatch(redux.actions.balance_update(balance))
  }

  async loadTxCounts () {
    const redux = this.store.getRedux('wallet')
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let pendingTxCount = await methods.pendingTxCount().call()
    let comfirmedTxCount = await methods.comfirmedTxCount().call()
    let revertedTxCount = await methods.revertedTxCount().call()

    await this.dispatch(redux.actions.pendingTxCount_update(pendingTxCount))
    await this.dispatch(redux.actions.comfirmedTxCount_update(comfirmedTxCount))
    await this.dispatch(redux.actions.revertedTxCount_update(revertedTxCount))
  }

  async loadPendingTxs () {
    const redux = this.store.getRedux('wallet')
    // await this.dispatch(redux.actions.pendingTxs_reset())
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let pendingTxCount = await methods.pendingTxCount().call()
    let pendingTxIds = await methods.getPendingTransactionIds(0, pendingTxCount - 1).call()
    let txs = []
    for (let i = 0; i < pendingTxIds.length; i++) {
      let pendingTxId = pendingTxIds[i]
      let arrayTypeTx = await methods.transactions(pendingTxId).call()
      let comfirmations = await methods.getConfirmations(pendingTxId).call()
      let txObject = this.getTxObject(pendingTxId, comfirmations, arrayTypeTx)
      txs.push(txObject)
    }
    await this.dispatch(redux.actions.pendingTxs_update(txs))
  }

  async loadComfirmedTxs () {
    const redux = this.store.getRedux('wallet')
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let comfirmedTxCount = await methods.comfirmedTxCount().call()
    let comfirmedTxIds = await methods.getComfirmedTransactionIds(0, comfirmedTxCount - 1).call()
    let txs = []
    for (let i = 0; i < comfirmedTxIds.length; i++) {
      let comfirmedTxId = comfirmedTxIds[i]
      let arrayTypeTx = await methods.transactions(comfirmedTxId).call()
      let comfirmations = await methods.getConfirmations(comfirmedTxId).call()
      let txObject = this.getTxObject(comfirmedTxId, comfirmations, arrayTypeTx)
      txs.push(txObject)
    }
    await this.dispatch(redux.actions.comfirmedTxs_update(txs))
  }

  async loadRevertedTxs () {
    const redux = this.store.getRedux('wallet')
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let revertedTxCount = await methods.revertedTxCount().call()
    let revertedTxIds = await methods.getRevertedTransactionIds(0, revertedTxCount - 1).call()
    let txs = []
    for (let i = 0; i < revertedTxIds.length; i++) {
      let revertedTxId = revertedTxIds[i]
      let arrayTypeTx = await methods.transactions(revertedTxId).call()
      let comfirmations = await methods.getConfirmations(revertedTxId).call()
      let txObject = this.getTxObject(revertedTxId, comfirmations, arrayTypeTx)
      txs.push(txObject)
    }
    await this.dispatch(redux.actions.revertedTxs_update(txs))
  }

  async loadNtfBalance () {
    const redux = this.store.getRedux('wallet')
    let store = this.store.getState()
    let methods = store.contracts.ntfToken.methods
    let ntfBalance = await methods.balanceOf(store.contracts.walletPro._address).call()
    await this.dispatch(redux.actions.ntfBalance_update(ntfBalance))
  }

  async transferNtf (to, amount, description) {
    let store = this.store.getState()
    let ntfMethods = store.contracts.ntfToken.methods
    let data = ntfMethods.transfer(to, amount).encodeABI()
    let methods = store.contracts.walletPro.methods
    let destination = store.contracts.ntfToken._address
    let toBytes32 = fillBytes32(utils.asciiToHex(description))
    if (!store.user.wallet) {
      console.log('wallet not found to sign')
      return false
    }
    let rs = await methods.submitTransaction(destination, 0, data, toBytes32).send({ from: store.user.wallet })
    return rs
  }

  async transferNty (to, amount, description) {
    let store = this.store.getState()
    let data = []
    let methods = store.contracts.walletPro.methods
    let destination = to
    let toBytes32 = fillBytes32(utils.asciiToHex(description))
    if (!store.user.wallet) {
      console.log('wallet not found to sign')
      return false
    }
    let rs = await methods.submitTransaction(destination, amount, data, toBytes32).send({ from: store.user.wallet })
    return rs
  }

  async comfirm (txId) {
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    return await methods.confirmTransaction(txId).send({from: store.user.wallet})
  }

  async revoke (txId) {
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    return await methods.revokeConfirmation(txId).send({from: store.user.wallet})
  }

  async loadOwners () {
    const redux = this.store.getRedux('wallet')
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let ownersCount = await methods.ownersCount().call()
    await this.dispatch(redux.actions.ownersCount_update(ownersCount))
    let owners = []
    for (let i = 0; i < ownersCount; i++) {
      let owner = await methods.owners(i).call()
      owners.push(owner)
    }
    await this.dispatch(redux.actions.owners_update(owners))
  }

  getTxObject (id, comfirmations, arrayTypeTx) {
    return {
      id: id,
      destination: arrayTypeTx[0],
      value: arrayTypeTx[1],
      data: arrayTypeTx[2],
      executed: Boolean(arrayTypeTx[3]),
      count: Number(arrayTypeTx[4]),
      description: utils.hexToAscii(arrayTypeTx[5]),
      comfirmations: comfirmations,
      comfirmed: this.isComfirmed(comfirmations)
    }
  }

  isComfirmed (comfirmatons) {
    let store = this.store.getState()
    let len = comfirmatons.length
    let wallet = store.user.wallet
    if (!len) return false
    for (let i = 0; i < len; i++) {
      if (wallet.toLowerCase() === comfirmatons[i].toLowerCase()) {
        return true
      }
    }
    return false
  }
}
