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

  renderOwners () {
    let obj = Object(this.props.owners)
    let owners = Object.keys(obj).map(function(key) {
      return [Number(key), obj[key]];
    });

    return (
      <div>
        <p>Owner List</p>
        {owners.map((data) => <p key={data[0]}>{data[1].name} {data[1].address}</p>)}
      </div>
    )
  }

  renderBaseInfo () {
    return (
      <div>
        <p>Foundation Wallet: {this.props.address}</p>
        <p>Balance: {weiToEther(this.props.balance)} NTY / {weiToEther(this.props.ntfBalance)} NTF</p>
        <p>Execution Requirement: {this.props.required} Confirmations / {this.props.ownersCount} Owners</p>
        <p>
          {this.props.pendingTxCount} Pending /
          {this.props.executedTxCount} Executed
        </p>
      </div>
    )
  }

  renderTransfer () {
    return (
      <Row style={{ 'marginTop': '15px' }}>

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
      </Row>
    )
  }

  ord_renderContent () { // eslint-disable-line
    return (
      <div className="">
        <div className="ebp-header-divider">
          {this.renderBaseInfo()}
          {this.renderOwners()}
          {this.renderTransfer()}
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
