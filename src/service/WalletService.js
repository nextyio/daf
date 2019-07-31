import BaseService from '../model/BaseService'
import { utils } from 'web3'
import { CONTRACTS } from '@/constant'


function fillBytes32 (text) {
  let s = text.split('x')[1]
  let len = s.length
  let toFill = 32 - len
  for (let i = 1; i <= toFill; i++)
      s = '0' + s
  return '0x' + s
}

export default class extends BaseService {

  /*
    WALLET MASTER
  */
  async create (ownersObj, required) {
    const owners = ownersObj.map((owner) => owner.address)
    const ownerNames = ownersObj.map((owner) => owner.name)
    const toBytes32 = ownerNames.map((ownerName) => fillBytes32(utils.asciiToHex(ownerName)))
    // let owners = ['0x95e2fcBa1EB33dc4b8c6DCBfCC6352f0a253285d', '0xF20BC2E136e83ab3957d79E1a321F6AfAe5ebee6']
    // let ownerNames = ['testacc', 'cash out']
    // let toBytes32 = ownerNames.map((ownerName) => fillBytes32(web3.utils.asciiToHex(ownerName)))
    // let required = 2
    // await deployer.deploy(
    //     Wallet,
    //     owners,
    //     toBytes32,
    //     required,
    // )
    let store = this.store.getState()
    console.log('xxx', owners)
    console.log('xxx', required)
    let methods = store.contracts.walletMaster.methods
    const rs = await methods.create(owners, toBytes32, required).send({from: store.user.wallet})
    await this.loadMyWallets()
    return rs
    // let contractInstance = new web3.eth.Contract(CONTRACTS.Wallet.abi)
    // console.log('xxx', contractInstance)
    // let deploy = contractInstance.deploy({
    //   arguments: owners
    // }).encodeABI()
  }

  async loadMyWallets () {
    let store = this.store.getState()
    let methods = store.contracts.walletMaster.methods
    const rs = await methods.myWallets().call({ from: store.user.wallet })
    const redux = this.store.getRedux('user')
    await this.dispatch(redux.actions.myWallets_update(rs))
    if (!store.user.selectedWallet && rs.length > 0) {
      console.log('xxx', rs[0])
      await this.selectWallet(rs[0])
    }
  }

  async selectWallet (_address) {
    let store = this.store.getState()
    if (_address.toLowerCase() === store.user.selectedWallet.toLowerCase()) {
      return
    }
    const contractsRedux = this.store.getRedux('contracts')
    const userRedux = this.store.getRedux('user')
    const WalletPro = new store.user.web3.eth.Contract(CONTRACTS.Wallet.abi, _address)
    await this.dispatch(contractsRedux.actions.walletPro_update(WalletPro))
    await this.dispatch(userRedux.actions.selectedWallet_update(_address))
    await this.reload()
  }

  async reload () {
    this.loadAddress(null)
    this.loadBalance()
    this.loadNtfBalance()
    this.loadRequired()
    this.loadOwners()
    this.loadPendingTxCount()
    this.loadExecutedTxCount()
    this.loadTxs()
    this.loadMyWallets()
  }

  /******************************************************/

  async loadNtfPool (_poolAddress) {
    const redux = this.store.getRedux('wallet')
    let store = this.store.getState()
    let web3 = store.user.web3
    const pool = new web3.eth.Contract(CONTRACTS.NtfPool.abi, _poolAddress)
    await this.dispatch(redux.actions.ntfPool_update(pool))
    const methods = await pool.methods
    const poolName = await methods.name().call()
    await this.dispatch(redux.actions.ntfPoolName_update(poolName))
  }

  async loadAddress (_ERC20address) {
    const redux = this.store.getRedux('wallet')
    let store = this.store.getState()
    let address = store.contracts.walletPro._address
    await this.dispatch(redux.actions.address_update(address))
    let ERC20Address = _ERC20address !== null ? _ERC20address : store.contracts.ntfToken._address
    await this.dispatch(redux.actions.ERC20Address_update(ERC20Address))
    let web3 = store.user.web3
    let ERC20Contract = new web3.eth.Contract(CONTRACTS.NtfToken.abi, ERC20Address)
    let methods = ERC20Contract.methods
    let ERC20Name = await methods.name().call()
    await this.dispatch(redux.actions.ERC20Name_update(ERC20Name))
    let ERC20Decimal = await methods.decimals().call()
    await this.dispatch(redux.actions.ERC20Decimal_update(ERC20Decimal))
    let ERC20Balance = await methods.balanceOf(address).call()
    await this.dispatch(redux.actions.ERC20Balance_update(ERC20Balance))
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
    await this.dispatch(redux.actions.pendingTxs_reset())
    await this.dispatch(redux.actions.executedTxs_reset())
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

  async removeOwner (_address) {
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let description = 'rm owner'
    let amount = 0
    let to = store.contracts.walletPro._address
    let data = methods.removeOwner(_address).encodeABI()
    let destination = to
    let toBytes32 = fillBytes32(utils.asciiToHex(description))
    console.log('xxx', toBytes32)
    if (!store.user.wallet) {
      console.log('wallet not found to sign')
      return false
    }
    let rs = await methods.submitTransaction(destination, amount, data, toBytes32).send({ from: store.user.wallet })
    return rs
  }

  async addOwner (_address, _name) {
    let nameBytes32 = fillBytes32(utils.asciiToHex(_name))
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let description = 'add owner'
    let amount = 0
    let to = store.contracts.walletPro._address
    let data = methods.addOwner(_address, nameBytes32).encodeABI()
    let destination = to
    let toBytes32 = fillBytes32(utils.asciiToHex(description))
    if (!store.user.wallet) {
      console.log('wallet not found to sign')
      return false
    }
    console.log('xxx', store.user.wallet)
    let rs = await methods.submitTransaction(destination, amount, data, toBytes32).send({ from: store.user.wallet })
    return rs
  }

  async distributeCoin () {
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let description = 'Distribute Coin'
    let amount = 0
    let to = store.contracts.walletPro._address
    let data = methods.distributeCoin().encodeABI()
    let destination = to
    let toBytes32 = fillBytes32(utils.asciiToHex(description))
    if (!store.user.wallet) {
      console.log('wallet not found to sign')
      return false
    }
    let rs = await methods.submitTransaction(destination, amount, data, toBytes32).send({ from: store.user.wallet })
    return rs
  }

  async distributeERC20 (_tokenAddress) {
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let description = 'Distribute ERC20'
    let amount = 0
    let to = store.contracts.walletPro._address
    let data = methods.distributeERC20(_tokenAddress).encodeABI()
    let destination = to
    let toBytes32 = fillBytes32(utils.asciiToHex(description))
    if (!store.user.wallet) {
      console.log('wallet not found to sign')
      return false
    }
    let rs = await methods.submitTransaction(destination, amount, data, toBytes32).send({ from: store.user.wallet })
    return rs
  }

  async tokenDeposit (_ntfPoolAddress, _amount) {
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let description = 'tokenDeposit'
    let amount = 0
    let to = store.contracts.walletPro._address
    let data = methods.tokenDeposit(_ntfPoolAddress, _amount).encodeABI()
    let destination = to
    let toBytes32 = fillBytes32(utils.asciiToHex(description))
    if (!store.user.wallet) {
      console.log('wallet not found to sign')
      return false
    }
    let rs = await methods.submitTransaction(destination, amount, data, toBytes32).send({ from: store.user.wallet })
    return rs
  }

  async requestOut (_ntfPoolAddress, _amount) {
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let description = 'requestOut'
    let amount = 0
    let to = store.contracts.walletPro._address
    let data = methods.requestOut(_ntfPoolAddress, _amount).encodeABI()
    let destination = to
    let toBytes32 = fillBytes32(utils.asciiToHex(description))
    if (!store.user.wallet) {
      console.log('wallet not found to sign')
      return false
    }
    let rs = await methods.submitTransaction(destination, amount, data, toBytes32).send({ from: store.user.wallet })
    return rs
  }

  async tokenMemberWithdraw (_ntfPoolAddress) {

    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let description = 'Withdraw Token'
    let amount = 0
    let to = store.contracts.walletPro._address
    let data = methods.tokenMemberWithdraw(_ntfPoolAddress).encodeABI()
    let destination = to
    let toBytes32 = fillBytes32(utils.asciiToHex(description))
    if (!store.user.wallet) {
      console.log('wallet not found to sign')
      return false
    }
    let rs = await methods.submitTransaction(destination, amount, data, toBytes32).send({ from: store.user.wallet })
    return rs
  }

  async coinWithdraw (_ntfPoolAddress) {
    let store = this.store.getState()
    let methods = store.contracts.walletPro.methods
    let description = 'Withdraw Coin'
    let amount = 0
    let to = store.contracts.walletPro._address
    let data = methods.coinWithdraw(_ntfPoolAddress).encodeABI()
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