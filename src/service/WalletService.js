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

  async loadDeployedAt () {
    const redux = this.store.getRedux('wallet')
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let deployedAt = await methods.deployedAt().call()
    await this.dispatch(redux.actions.deployedAt_update(deployedAt))
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
    let balance = await store.user.web3.eth.getBalance(store.wallet.address)
    await this.dispatch(redux.actions.balance_update(balance))
  }

  async loadPendingTxCount () {
    const redux = this.store.getRedux('wallet')
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let pendingTxCount = await methods.pendingTxCount().call()
    await this.dispatch(redux.actions.pendingTxCount_update(pendingTxCount))
  }

  async loadExecutedTxCount () {
    const redux = this.store.getRedux('wallet')
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let executedTxCount = await methods.executedTxCount().call()
    await this.dispatch(redux.actions.executedTxCount_update(executedTxCount))
  }

  async loadTxs () {
    const redux = this.store.getRedux('wallet')
    let store = this.store.getState()
    let wallet = store.user.wallet
    let methods = store.contracts.walletPro.methods
    let events = await this.getPastEvents('Submission', null, 0, 0)
    if (events.length === 0) return
    let pendingTxs = []
    let executedTxs = []
    for (let i = 0; i < events.length; await i++) {
      let event = await events[i]
      let txId = event.returnValues[0]
      // console.log('txId', txId)
      let rawTx = await methods.transactions(txId).call()
      let confirmations = await methods.getConfirmations(txId).call()
      let confirmed = this.isConfirmedByMe(confirmations)
      let tx = {
        id: txId,
        destination: rawTx[0],
        value: rawTx[1],
        data: rawTx[2],
        executed: Boolean(rawTx[3]),
        count: Number(rawTx[4]),
        description: utils.hexToAscii(rawTx[5]),
        confirmations: confirmations,
        confirmed: Boolean(confirmed)
      }
      if (!tx.executed) {
        pendingTxs.push(tx)
      } else {
        executedTxs.push(tx)
      }
    }
    await this.dispatch(redux.actions.pendingTxs_update(pendingTxs))
    await this.dispatch(redux.actions.executedTxs_update(executedTxs))
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

  async execute (txId) {
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    return await methods.executeTransaction(txId).send({from: store.user.wallet})
  }

  async confirm (txId) {
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
      let ownerAddress = await methods.owners(i).call()
      let ownerName = await methods.ownerName(ownerAddress).call()
      let owner = {
        address: ownerAddress,
        name: utils.toAscii(ownerName)
      }
      owners.push(owner)
    }
    await this.dispatch(redux.actions.owners_update(owners))
  }

  isConfirmedByMe (confirmatons) {
    let store = this.store.getState()
    let len = confirmatons.length
    let wallet = store.user.wallet
    if (!len) return false
    for (let i = 0; i < len; i++) {
      if (wallet.toLowerCase() === confirmatons[i].toLowerCase()) {
        return true
      }
    }
    return false
  }

  async getPastEvents (eventName, filter, fromBlock, toBlock) {
    let store = this.store.getState()
    let contract = store.contracts.walletPro
    let methods = contract.methods
    let deployedAt = await methods.deployedAt().call()
    return await contract.getPastEvents(eventName, {
      filter: filter,
      fromBlock: !fromBlock ? deployedAt : fromBlock,
      toBlock: toBlock ? toBlock : 'latest'
    })
  }

  async getConfirmationNames (owners, confirmations) {
    let confirmationNames = []
    for (let i = 0; i < owners.length; i++) {
      let owner = owners[i]
      confirmationNames.push(owner.name)
    }
  }
}