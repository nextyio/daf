import React from 'react' // eslint-disable-line
import LoggedInPage from '../LoggedInPage'
import Footer from '@/module/layout/Footer/Container' // eslint-disable-line
import Tx from 'ethereumjs-tx' // eslint-disable-line
import { Link } from 'react-router-dom' // eslint-disable-line
import web3 from 'web3'
import { cutString } from '@/service/Help'
import moment from 'moment'

import './style.scss'

import { Col, Row, Icon, Notification, Breadcrumb, Button, Select, Input } from 'antd' // eslint-disable-line
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

  onOwnerChange (e) {
    this.setState({
      owner: e.target.value
    })
  }

  onOwnerNameChange (e) {
    this.setState({
      ownerName: e.target.value
    })
  }

  onToChange (e) {
    this.setState({
      to: e.target.value
    })
  }

  async addOwner () {
    let owner = this.state.owner.toLowerCase()
    let ownerName = this.state.ownerName
    // let owners = this.props.owners.map((obj) => obj.address)
    let obj = Object(this.props.owners)
    let owners = Object.keys(obj).map(function(key) {
      return obj[key].address.toLowerCase()
    });
    const exist = owners.includes(owner)
    
    if (exist) {
      Notification.error({
        message: 'owner already exist'
      })
      return
    }

    try {
      await this.props.addOwner(this.state.owner, ownerName)
    } catch (e) {
      let eString = e.toString()
      Notification.error({
        message: eString.length > 20 ? 'Something wrong' : eString
      })
    }
  }

  async removeOwner () {
    let owner = this.state.owner.toLowerCase()
    // let owners = this.props.owners.map((obj) => obj.address)
    let obj = Object(this.props.owners)
    let owners = Object.keys(obj).map(function(key) {
      return obj[key].address.toLowerCase()
    });
    const exist = owners.includes(owner)

    if (!exist) {
      Notification.error({
        message: 'invalid owner address to remove'
      })
      return
    }
    try {
      await this.props.removeOwner(this.state.owner)
    } catch (e) {
      let eString = e.toString()
      Notification.error({
        message: eString.length > 20 ? 'Something wrong' : eString
      })
    }
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

  renderAddRemove () {
    return (
      <Row style={{ 'marginTop': '15px' }}>
        <Col span={6}>
          Address:
        </Col>
        <Col span={18}>

          <Input
            className = "maxWidth"
            defaultValue={''}
            value={this.state.owner}
            onChange={this.onOwnerChange.bind(this)}
          />
        </Col>

        <Col span={6}>
          name:
        </Col>
        <Col span={18}>

          <Input
            className = "maxWidth"
            defaultValue={''}
            value={this.state.ownerName}
            onChange={this.onOwnerNameChange.bind(this)}
          />
        </Col>

        <Col span={12} style={{ 'marginTop': '15px' }}>
          <Button onClick={this.addOwner.bind(this)} type="primary" className="btn-margin-top submit-button maxWidth">Add</Button>
        </Col>
        <Col span={12} style={{ 'marginTop': '15px' }}>
          <Button onClick={this.removeOwner.bind(this)} type="primary" className="btn-margin-top submit-button maxWidth">Remove(address only)</Button>
        </Col>
      </Row>
    )
  }

  ord_renderContent () { // eslint-disable-line
    return (
      <div className="">
        <div className="ebp-header-divider">
          <h1> Owners list/add/remove</h1>
          {this.renderOwners()}
          {this.renderAddRemove()}
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
