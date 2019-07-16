import React from 'react' // eslint-disable-line
import ReactDOM from 'react-dom'
import _ from 'lodash'
import { BrowserRouter, Route, Switch } from 'react-router-dom' // eslint-disable-line
import { Provider } from 'react-redux' // eslint-disable-line
import { ConnectedRouter } from 'react-router-redux' // eslint-disable-line
import store from '@/store'
import config from '@/config'
import { USER_ROLE } from '@/constant'
import { api_request } from './util' // eslint-disable-line
import UserService from '@/service/UserService'
import {Helmet} from "react-helmet"
import Web3 from 'web3'
import { WEB3, CONTRACTS } from '@/constant'

import './boot'
import './style/index.scss'

const middleware = (render, props) => {
  return render
}

const App = () => { // eslint-disable-line
  return (
    <div>
      <Helmet>
          {/*<script defer src="/assets/js/web310.js"></script>*/}
      </Helmet>
      <Switch id="ss-main">
        {_.map(config.router, (item, i) => {
          const props = _.omit(item, ['page', 'path', 'type'])
          const R = item.type || Route // eslint-disable-line
          return (
            <R path={item.path} key={i} exact component={item.page} {...props} />
          )
        })}
      </Switch>
    </div>
  )
}

const render = () => {
  ReactDOM.render(
    <Provider store={store}>
      <ConnectedRouter middleware={middleware} history={store.history}>
        <App />
      </ConnectedRouter>
    </Provider>,
    document.getElementById('ss-root')
  )
}

const userRedux = store.getRedux('user')
const contractsRedux = store.getRedux('contracts')
const userService = new UserService()
let isRequest = false
let isLogined = false

function setupWeb3 () {
  window.web3.eth.getAccounts(async (err, accounts) => {
    if (err) return
    if (accounts.length > 0) {
        window.web3.version.getNetwork( async (err, networkId) => {
            if (networkId === WEB3.NETWORK_ID) {
                let web3 = new Web3(window.ethereum)
                let web3Event = new Web3('http://rpc.testnet.nexty.io:8545')

                const contract = {
                  NtfToken: new web3.eth.Contract(CONTRACTS.NtfToken.abi, CONTRACTS.NtfToken.address),
                  WalletPro: new web3.eth.Contract(CONTRACTS.Wallet.abi, CONTRACTS.Wallet.address),
                  WalletProEvent: new web3Event.eth.Contract(CONTRACTS.Wallet.abi, CONTRACTS.Wallet.address),
                }

                if (!isLogined) {
                  await store.dispatch(userRedux.actions.loginMetamask_update(true))
                  await store.dispatch(contractsRedux.actions.ntfToken_update(contract.NtfToken))
                  await store.dispatch(contractsRedux.actions.walletPro_update(contract.WalletPro))
                  await store.dispatch(contractsRedux.actions.walletProEvent_update(contract.WalletProEvent))
                  await store.dispatch(userRedux.actions.web3_update(web3))
                  await userService.metaMaskLogin(accounts[0])
                  userService.path.push('/wallet')
                }
                isLogined = true
            } else if (!isLogined) {
                await store.dispatch(userRedux.actions.loginMetamask_update(false))
                await userService.path.push('/login')
            }
        })
    } else {
        if (!isRequest) {
            isRequest = true
            await window.ethereum.enable()
        }
        await store.dispatch(userRedux.actions.loginMetamask_update(false))
        isLogined = false
        await userService.path.push('/login')
    }
  })
}

if (window.ethereum) {
    setInterval(() => {
      window.web3.eth.getAccounts(async(err, accounts) => {
        let userState = store.getState('user').user
        if (userState.wallet && userState.wallet.toLowerCase() !== accounts[0].toLowerCase()) {
          window.location.reload()
        }
      })
    }, 5000)
    setupWeb3()

    window.web3.currentProvider.publicConfigStore.on('update', async () => {
      setupWeb3()
    })
} else {
  store.dispatch(userRedux.actions.loginMetamask_update(false))
}

if (sessionStorage.getItem('api-token')) { // eslint-disable-line
  const userRedux = store.getRedux('user')
  api_request({
    path: '/user/current_user',
    success: data => {
      store.dispatch(userRedux.actions.is_login_update(true))
      if ([USER_ROLE.ADMIN, USER_ROLE.COUNCIL].includes(data.role)) {
        store.dispatch(userRedux.actions.is_admin_update(true))
      }
      store.dispatch(userRedux.actions.profile_update(data.profile))
      store.dispatch(userRedux.actions.role_update(data.role))

      render()
    }
  })
} else {
  render()
}
