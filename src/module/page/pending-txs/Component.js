import React from 'react' // eslint-disable-line
import LoggedInPage from '../LoggedInPage'
import Footer from '@/module/layout/Footer/Container' // eslint-disable-line
import Tx from 'ethereumjs-tx' // eslint-disable-line
import { Link } from 'react-router-dom' // eslint-disable-line
import web3 from 'web3'
import { cutString } from '@/service/Help'
import moment from 'moment'

import './style.scss'

import { Col, Row, Icon, InputNumber, Breadcrumb, Button, Select, Input, Table } from 'antd' // eslint-disable-line
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
        {owners.map((data) => <p key={data[0]}>{data[1]}</p>)}
      </div>
    )
  }

  renderBaseInfo () {
    return (
      <div>
        <p>wallet: {this.props.address}</p>
        <p>balance: {weiToEther(this.props.balance)} NTY / {weiToEther(this.props.ntfBalance)} NTF</p>
        <p>type: {this.props.required} / {this.props.ownersCount}</p>
        <p>
          {this.props.pendingTxCount} Pending /
          {this.props.comfirmedTxCount} Comfirmed /
          {this.props.revertedTxCount} Reverted
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

  renderComfirmButton(record) {
    return (
      <button onClick={() => record.comfirmed ? this.revoke(record.id) : this.comfirm(record.id)}> {record.comfirmed ? <Icon type="dislike" /> : <Icon type="like" />} </button>
    )
  }

  async comfirm(txId) {
    return await this.props.comfirm(txId)
  }

  async revoke(txId) {
    return await this.props.revoke(txId)
  }

  renderPendingTxs() {
    let obj = Object(this.props.pendingTxs)
    let data = Object.keys(obj).map(function(key) {
      console.log(obj[key])
      return obj[key]
    });
    const columns = [
        {
            title: 'Pending Txs: ' + this.props.pendingTxCount,
            children: [
                {
                    title: 'Tx ID',
                    dataIndex: 'id',
                    key: 'id',
                    render: (id, record) => {
                        return cutString(id)
                    }
                },
                {
                    title: 'Destination',
                    dataIndex: 'destination',
                    key: 'destination',
                    render: (destination, record) => {
                        return cutString(destination)
                    }
                },
                {
                    title: 'Value',
                    dataIndex: 'value',
                    key: 'value',
                    render: (value, record) => {
                        return web3.utils.fromWei(value.toString(), 'ether')
                    }
                },
                {
                    title: 'Description',
                    dataIndex: 'description',
                    key: 'description',
                    render: (description, record) => {
                        return description
                    }
                },
                {
                    title: 'comfirmed',
                    dataIndex: 'count',
                    key: 'count',
                    render: (count, record) => {
                        return count
                    }
                },
                {
                    title: 'data',
                    dataIndex: 'data',
                    key: 'data',
                    render: (data, record) => {
                        return cutString(data)
                    }
                },
                {
                    title: 'Action',
                    dataIndex: 'action',
                    key: 'comfirmed',
                    render: (comfirmed, record) => {
                        console.log('xxx', record)
                        return (
                          this.renderComfirmButton(record)
                        )
                    }
                },
            ]
        }
    ]

    return (
        <div>
            <Table
                dataSource={data}
                loading={this.props.loading}
                columns={columns}
                pagination={false}
                rowKey="id">
            </Table>
        </div>
    )
  }

  ord_renderContent () { // eslint-disable-line
    return (
      <div className="">
          {this.renderPendingTxs()}
      </div>
    )
  }

  ord_renderBreadcrumb () { // eslint-disable-line
    return (
      <Breadcrumb style={{ 'marginLeft': '16px', 'marginTop': '16px', float: 'right' }}>
        <Breadcrumb.Item><Link to="/wallet"><Icon type="home" /> Home</Link></Breadcrumb.Item>
        <Breadcrumb.Item>Pending Txs</Breadcrumb.Item>
      </Breadcrumb>
    )
  }
}
