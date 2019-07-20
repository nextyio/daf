import React from 'react' // eslint-disable-line
import LoggedInPage from '../LoggedInPage'
import Footer from '@/module/layout/Footer/Container' // eslint-disable-line
import Tx from 'ethereumjs-tx' // eslint-disable-line
import { Link } from 'react-router-dom' // eslint-disable-line
import web3 from 'web3'
import { cutString } from '@/service/Help'
import moment from 'moment'

import './style.scss'

import { Col, Row, Icon, InputNumber, Breadcrumb, Button, Select, Input } from 'antd' // eslint-disable-line
const Option = Select.Option

const weiToEther = (wei) => {
  return Number(web3.utils.fromWei(wei.toString())).toFixed(4)
}

const etherToWei = (ether) => {
  return web3.utils.toWei(ether.toString(), 'ether')
}

const toTime = (value) => {
  var dateString = moment.unix(value).format('DD/MM/YYYY')
  return dateString
}

export default class extends LoggedInPage {
  componentDidMount () {
    this.loadData()
  }

  loadData () {
  }

  onPoolChange (e) {
    this.setState({
      pool: e.target.value
    })
  }

  onNtfAmountChange (value) {
    this.setState({
      ntfAmount: value
    })
  }

  async tokenDeposit () {
    let amount = this.state.ntfAmount
    return await this.props.tokenDeposit(this.state.pool, etherToWei(amount))
  }

  async requestOut () {
    let amount = this.state.ntfAmount
    return await this.props.requestOut(this.state.pool, etherToWei(amount))
  }

  async tokenMemberWithdraw () {
    return await this.props.tokenMemberWithdraw(this.state.pool)
  }

  async coinWithdraw () {
    return await this.props.coinWithdraw(this.state.pool)
  }

  async loadNtfPool () {
    const pool = this.state.pool
    return this.props.loadNtfPool(pool)
  }

  renderPoolSelect () {
    return (
      <Row style={{ 'marginTop': '15px' }}>

        <Col span={6}>
          <Button onClick={this.loadNtfPool.bind(this)} type="primary" className="btn-margin-top submit-button maxWidth">Load NTF Pool</Button>
        </Col>
        <Col span={18}>

          <Input
            className = "maxWidth"
            defaultValue={0}
            value={this.state.pool}
            onChange={this.onPoolChange.bind(this)}
          />
        </Col>
        {this.props.ntfPoolName && this.renderPoolActions()}
      </Row>
    )
  }

  renderPoolActions () {
    return (
      <div>
        <Col span={24}>
          Selected Pool: {this.props.ntfPoolName}
        </Col>

        <Col span={6}>
          Amount(NTF):
        </Col>
        <Col span={18}>

          <InputNumber
            className = "maxWidth"
            defaultValue={0}
            value={this.state.ntfAmount}
            onChange={this.onNtfAmountChange.bind(this)}
          />
        </Col>
        <Col span={12} style={{ 'marginTop': '15px' }}>
          <Button onClick={this.tokenDeposit.bind(this)} type="primary" className="btn-margin-top submit-button maxWidth">Deposit NTF</Button>
        </Col>
        <Col span={12} style={{ 'marginTop': '15px' }}>
          <Button onClick={this.requestOut.bind(this)} type="primary" className="btn-margin-top submit-button maxWidth">Request Out</Button>
        </Col>
        <Col span={24} style={{ 'marginTop': '15px' }}>
          <Button onClick={this.tokenMemberWithdraw.bind(this)} type="primary" className="btn-margin-top submit-button maxWidth">Withdraw NTF</Button>
        </Col>
        <Col span={24} style={{ 'marginTop': '15px' }}>
          <Button onClick={this.coinWithdraw.bind(this)} type="primary" className="btn-margin-top submit-button maxWidth">Claim NTY Reward</Button>
        </Col>
      </div>
    )
  }

  ord_renderContent () { // eslint-disable-line
    return (
      <div className="">
        <div className="ebp-header-divider">
          <h1> Governance's actions</h1>
          {this.renderPoolSelect()}
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
