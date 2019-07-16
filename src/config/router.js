import WalletPage from '@/module/page/wallet/Container'
import PendingTxsPage from '@/module/page/pending-txs/Container'
import ExecutedTxsPage from '@/module/page/executed-txs/Container'

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
    page: PendingTxsPage
  },
  {
    path: '/executed-txs',
    page: ExecutedTxsPage
  },
  {
    path: '/login',
    page: LoginPage
  },
  {
    page: NotFound
  }
]
