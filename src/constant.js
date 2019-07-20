import NTFToken from './../deployed/NtfToken.json'
import NtfPool from './../deployed/pool/NtfPool.json'
import NextyGovernanceABI from './../deployed/NextyGovernance.json'
import Wallet from './../build/contracts/Wallet.json'

const TEST_MODE = false
const NetId = TEST_MODE ? '111111' : '66666'

export const USER_ROLE = {
  MEMBER: 'MEMBER',
  LEADER: 'LEADER',
  ADMIN: 'ADMIN',
  COUNCIL: 'COUNCIL'
}

export const CONTRACTS =
  {
    'NtfToken':
      {
        'abi': NTFToken.abi,
        'address': '0x2c783ad80ff980ec75468477e3dd9f86123ecbda'
      },
    'NextyGovernance':
      {
        'abi': NextyGovernanceABI,
        'address': '0x0000000000000000000000000000000000012345'
      },
    'Wallet':
      {
        'abi': Wallet.abi,
        'address': Wallet.networks[NetId].address
      },
    'NtfPool':
      {
        'abi': NtfPool.abi,
        'address': '0x0000000000000000000000000000000000000000'
      }
  }

export const WEB3 = {
  HTTP: TEST_MODE ? 'http://rpc.testnet.nexty.io:8545' : 'http://rpc.nexty.io', // mainnet
  NETWORK_ID: NetId
}

// To change WEB3 ABI ADDRESS

export const USER_LANGUAGE = {
  en: 'en',
  zh: 'zh'
}

export const TEAM_ROLE = {
  MEMBER: 'MEMBER',
  OWNER: 'OWNER'
}

export const TASK_CATEGORY = {
  DEVELOPER: 'DEVELOPER',
  SOCIAL: 'SOCIAL',
  LEADER: 'LEADER'
}

export const TASK_TYPE = {
  TASK: 'TASK',
  SUB_TASK: 'SUB_TASK',
  PROJECT: 'PROJECT',
  EVENT: 'EVENT'
}

export const TASK_STATUS = {
  PROPOSAL: 'PROPOSAL',
  CREATED: 'CREATED',
  APPROVED: 'APPROVED',
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED'
}

export const TASK_CANDIDATE_TYPE = {
  USER: 'USER',
  TEAM: 'TEAM'
}

export const TASK_CANDIDATE_STATUS = {
  // NOT_REQUIRED: 'NOT_REQUIRED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
}

export const COMMUNITY_TYPE = {
  COUNTRY: 'COUNTRY',
  STATE: 'STATE',
  CITY: 'CITY',
  REGION: 'REGION',
  SCHOOL: 'SCHOOL'
}

export const TRANS_STATUS = {
  PENDING: 'PENDING',
  CANCELED: 'CANCELED',
  FAILED: 'FAILED',
  SUCCESSFUL: 'SUCCESSFUL'
}

export const ISSUE_CATEGORY = {
  BUG: 'BUG',
  SECURITY: 'SECURITY',
  SUGGESTION: 'SUGGESTION',
  OTHER: 'OTHER'
}

export const CONTRIB_CATEGORY = {
  BLOG: 'BLOG',
  VIDEO: 'VIDEO',
  PODCAST: 'PODCAST',
  OTHER: 'OTHER'
}

export const DEFAULT_IMAGE = {
  TASK: '/assets/images/task_thumbs/12.jpg'
}

export const MIN_VALUE_DEPOSIT = 500000
