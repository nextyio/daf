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

  renderComfirmedTxs () {
    let obj = Object(this.props.comfirmedTxs)
    let data = Object.keys(obj).map(function(key) {
      console.log(obj[key])
      return obj[key]
    });
    const columns = [
        {
            title: 'Comfirmed Txs: ' + this.props.comfirmedTxCount,
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
                    title: 'data',
                    dataIndex: 'data',
                    key: 'data',
                    render: (data, record) => {
                        return cutString(data)
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
          {this.renderComfirmedTxs()}
      </div>
    )
  }

  ord_renderBreadcrumb () { // eslint-disable-line
    return (
      <Breadcrumb style={{ 'marginLeft': '16px', 'marginTop': '16px', float: 'right' }}>
        <Breadcrumb.Item><Link to="/wallet"><Icon type="home" /> Home</Link></Breadcrumb.Item>
        <Breadcrumb.Item>Comfirmed Txs</Breadcrumb.Item>
      </Breadcrumb>
    )
  }
}
