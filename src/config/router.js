import WalletPage from '@/module/page/wallet/Container'
import pendingTxsPage from '@/module/page/pending-txs/Container'
import comfirmedTxsPage from '@/module/page/comfirmed-txs/Container'
import revertedTxsPage from '@/module/page/reverted-txs/Container'

import LoginPage from '@/module/page/login/Container'

import NotFound from '@/module/page/error/NotFound'

export default [
  {
    path: '/',
    page: LoginPage
  },
  {
    path: '/home',
    page: LoginPage
  },
  {
    path: '/wallet',
    page: WalletPage
  },
  {
    path: '/pending-txs',
    page: pendingTxsPage
  },
  {
    path: '/comfirmed-txs',
    page: comfirmedTxsPage
  },
  {
    path: '/reverted-txs',
    page: revertedTxsPage
  },
  {
    path: '/login',
    page: LoginPage
  },
  {
    page: NotFound
  }
]
