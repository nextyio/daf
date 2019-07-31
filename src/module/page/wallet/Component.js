import React from 'react' // eslint-disable-line
import LoggedInPage from '../LoggedInPage'
import Footer from '@/module/layout/Footer/Container' // eslint-disable-line
import Tx from 'ethereumjs-tx' // eslint-disable-line
import { Link } from 'react-router-dom' // eslint-disable-line
import web3 from 'web3'
import { cutString } from '@/service/Help'
import moment from 'moment'

import './style.scss'

import { Col, Icon, InputNumber, Breadcrumb, Button, Select, Input } from 'antd' // eslint-disable-line
const Option = Select.Option

const weiToEther = (wei) => {
  if (wei === undefined) return 'Unknown'
  return Number(web3.utils.fromWei(wei.toString())).toFixed(4)
}

const toTime = (value) => {
  var dateString = moment.unix(value).format('DD/MM/YYYY')
  return dateString
}

export default class extends LoggedInPage {
  constructor () {
    super()
    this.state = {
      selectedWallet: ''
    }
  }

  componentDidMount () {
    this.loadData()
  }

  loadData () {
  }

  onNtfAmountChange (value) {
    this.setState({
      ntfAmount: value
    })
  }

  onDescriptionChange (e) {
    this.setState({
      description: e.target.value
    })
  }

  onToChange (e) {
    this.setState({
      to: e.target.value
    })
  }

  onWalletChange (e) {
    this.setState({
      selectedWallet: e.target.value
    })
  }

  async loadWallet () {
    let wallet = this.state.selectedWallet
    await this.props.selectWallet(wallet)
  }

  async transferNtf () {
    let amount = web3.utils.toWei(this.state.ntfAmount.toString(), 'ether')
    let to = this.state.to
    await this.props.transferNtf(to, amount, this.state.description)
  }

  async transferNty () {
    let amount = web3.utils.toWei(this.state.ntfAmount.toString(), 'ether')
    let to = this.state.to
    await this.props.transferNty(to, amount, this.state.description)
  }

  async distributeCoin () {
    await this.props.distributeCoin()
  }

  async distributeERC20 () {
    let _tokenAddress = this.props.ERC20Address
    await this.props.distributeERC20(_tokenAddress)
  }

  async handleSelectWallet (value) {
    this.setState({
      selectedWallet: value
    })
  }

  renderOwners () {
    let obj = Object(this.props.owners)
    let owners = Object.keys(obj).map(function(key) {
      return [Number(key), obj[key]];
    });

    return (
      <Col span={24}>
        <p>Owner List</p>
        {owners.map((data) => <p key={data[0]}>{data[1].name} {data[1].address}</p>)}
      </Col>
    )
  }

  renderBaseInfo () {
    let obj = Object(this.props.myWallets)
    let myWallets = Object.keys(obj).map(function(key) {
      return obj[key]
    });
    // const myWallets = this.props.myWallets ? this.props.myWallets : []
    return (
      <div>
        <Col span={6}><p>Import:</p></Col>
        <Col span={10}>
          <Input
            className = "maxWidth"
            defaultValue={this.state.selectedWallet}
            value={this.state.selectedWallet}
            onChange={this.onWalletChange.bind(this)}
          />
        </Col>
        <Col span={4}>
          <Select onChange={this.handleSelectWallet.bind(this)} className = "maxWidth" defaultValue="Yours">
            {myWallets.map((wallet) => {
              return (<Option key={wallet} value={wallet}>{wallet}</Option>)
            })}
          </Select>
        </Col>
        <Col span={4}><Button className = "maxWidth" type ="primary" onClick={() => this.loadWallet()}>Load</Button></Col>
        {this.props.address && <Col span={24}>
          <p>Wallet: {this.props.address}</p>
          <p>Balance: {weiToEther(this.props.balance)} NTY / {weiToEther(this.props.ntfBalance)} NTF</p>
          <p>Execution Requirement: {this.props.required} Confirmations / {this.props.ownersCount} Owners</p>
          <p>
            {this.props.pendingTxCount} Pending /
            {this.props.executedTxCount} Executed
          </p>
        </Col>}
      </div>
    )
  }

  renderTransfer () {
    return (
      <Col span={24} style={{ 'marginTop': '15px' }}>

        <Col span={6}>
          To:
        </Col>
        <Col span={18}>

          <Input
            className = "maxWidth"
            defaultValue={0}
            value={this.state.to}
            onChange={this.onToChange.bind(this)}
          />
        </Col>

        <Col span={6}>
          Amount(NTF or NTY):
        </Col>
        <Col span={18}>

          <InputNumber
            className = "maxWidth"
            defaultValue={0}
            value={this.state.ntfAmount}
            onChange={this.onNtfAmountChange.bind(this)}
          />
        </Col>

        <Col span={6}>
          Description:
        </Col>
        <Col span={18}>

          <Input
            className = "maxWidth"
            defaultValue={0}
            value={this.state.description}
            onChange={this.onDescriptionChange.bind(this)}
          />
        </Col>

        <Col span={12} style={{ 'marginTop': '15px' }}>
          <Button onClick={this.transferNtf.bind(this)} type="primary" className="btn-margin-top submit-button maxWidth">Transfer NTF</Button>
        </Col>
        <Col span={12} style={{ 'marginTop': '15px' }}>
          <Button onClick={this.transferNty.bind(this)} type="primary" className="btn-margin-top submit-button maxWidth">Transfer NTY</Button>
        </Col>
      </Col>
    )
  }

  renderCoinDistribution () {
    return (
      <Col span={24} style={{ 'marginTop': '15px' }}>

        <Col span={6}>
          total/share:
        </Col>
        <Col span={18}>
          {weiToEther(this.props.balance)}/{weiToEther(this.props.share)}
        </Col>
        <Col span={24} style={{ 'marginTop': '15px' }}>
          <Button onClick={this.distributeCoin.bind(this)} type="primary" className="btn-margin-top submit-button maxWidth">Distribute NTY</Button>
        </Col>
      </Col>
    )
  }

  renderERC20Distribution () {
    return (
      <Col span={24} style={{ 'marginTop': '15px' }}>
        <Col span={6}>
          ERC20 Token:
        </Col>
        <Col span={18}>
          <Input
              disabled = {true}
              className = "maxWidth"
              value={this.props.ERC20Address}
              onChange={this.onToChange.bind(this)}
            />
        </Col>

        <Col span={6}>
          ERC20 Token Name:
        </Col>
        <Col span={18}>
          {this.props.ERC20Name}
        </Col>

        <Col span={6}>
          ERC20 Token Decimal:
        </Col>
        <Col span={18}>
          {this.props.ERC20Decimal}
        </Col>

        <Col span={6}>
          total/share:
        </Col>
        <Col span={18}>
          {weiToEther(this.props.ERC20Balance)}/{weiToEther(this.props.ERC20Share)}
        </Col>

        <Col span={24} style={{ 'marginTop': '15px' }}>
          <Button onClick={this.distributeERC20.bind(this)} type="primary" className="btn-margin-top submit-button maxWidth">Distribute NTF</Button>
        </Col>
      </Col>
    )
  }

  ord_renderContent () { // eslint-disable-line
    return (
      <div className="">
        <div className="ebp-header-divider">
          {this.renderBaseInfo()}
          {this.props.address && this.renderOwners()}
          {this.props.address && this.renderTransfer()}
          {this.props.address && this.renderCoinDistribution()}
          {this.props.address && this.renderERC20Distribution()}
        </div>
      </div>
    )
  }

  ord_renderBreadcrumb () { // eslint-disable-line
    return (
      <Breadcrumb style={{ 'marginLeft': '16px', 'marginTop': '16px', float: 'right' }}>
        <Breadcrumb.Item><Link to="/wallet"><Icon type="home" /> Home</Link></Breadcrumb.Item>
      </Breadcrumb>
    )
  }
}
