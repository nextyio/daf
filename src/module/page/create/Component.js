import React from 'react' // eslint-disable-line
import LoggedInPage from '../LoggedInPage'
import Footer from '@/module/layout/Footer/Container' // eslint-disable-line
import Tx from 'ethereumjs-tx' // eslint-disable-line
import { Link } from 'react-router-dom' // eslint-disable-line
import web3 from 'web3'
import { cutString } from '@/service/Help'
import moment from 'moment'

import './style.scss'

import { Col, Row, Icon, InputNumber, Breadcrumb, Button, Select, Input, Notification, message } from 'antd' // eslint-disable-line
const Option = Select.Option

const weiToEther = (wei) => {
  return Number(web3.utils.fromWei(wei.toString())).toFixed(4)
}

const toTime = (value) => {
  var dateString = moment.unix(value).format('DD/MM/YYYY')
  return dateString
}

export default class extends LoggedInPage {

  constructor() {
    super();
    this.state = {
      ownerNumber: 2,
      required: 2,
      owners: [{ name: "", address: "" }, { name: "", address: "" }]
    };
  }

  componentDidMount () {
    this.loadData()
  }

  loadData () {
  }

  onOwnerNumberChange (value) {
    this.setState({
      ownerNumber: value
    })
  }

  onRequiredChange (value) {
    this.setState({
      required: value
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

  renderBaseInfo () {
    return (
      <div>
        <Col span={4}>
          Number of Owners
        </Col>
        <Col span={4}>
          <label>{this.state.owners.length}</label>
        </Col>

        <Col span={4}>
          Required
        </Col>
        <Col span={4}>

          <InputNumber
            className = "maxWidth"
            defaultValue={0}
            value={this.state.required}
            onChange={this.onRequiredChange.bind(this)}
          />
        </Col>

        <Col span={8}>
          <Button
            type="primary"
            className = "maxWidth primary"
            onClick={() => this.create()}
          >
            Create
          </Button>
        </Col>
        <p> </p>
        {this.state.owners.map((owner, idx) => (
          <Col span={24}>
            <Col span={6}>
              <Input
                type="text"
                placeholder={`owner #${idx + 1} name`}
                value={owner.name}
                onChange={this.handleOwnerNameChange(idx)}
              />
            </Col>

            <Col span={12}>
              <Input
                type="text"
                placeholder={`owner #${idx + 1} address`}
                value={owner.address}
                onChange={this.handleOwnerAddressChange(idx)}
              />
            </Col>

            <Col span={6}>
              <Button
                type="danger"
                onClick={this.handleRemoveOwner(idx)}
                className="maxWidth"
              >
                Remove
              </Button>
            </Col>

          </Col>
        ))}

        <Col span={24}>
          <Button
            type="dashed"
            onClick={this.handleAddOwner}
            className="maxWidth"
          >
            Add Owner
          </Button>
        </Col>
      </div>
    )
  }

  ord_renderContent () { // eslint-disable-line
    return (
      <div className="">
        <div className="ebp-header-divider">
          <h1> Create Multisign Wallet</h1>
          {this.renderBaseInfo()}
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

  handleAddOwner = () => {
    this.setState({
      owners: this.state.owners.concat([{ name: "" }])
    });
  };

  handleRemoveOwner = idx => () => {
    this.setState({
      owners: this.state.owners.filter((s, sidx) => idx !== sidx)
    });
  };

  handleOwnerNameChange = idx => evt => {
    const newOwners = this.state.owners.map((owner, sidx) => {
      if (idx !== sidx) return owner;
      return { ...owner, name: evt.target.value };
    });

    this.setState({ owners: newOwners });
  };

  handleOwnerAddressChange = idx => evt => {
    const newOwners = this.state.owners.map((owner, sidx) => {
      if (idx !== sidx) return owner;
      return { ...owner, address: evt.target.value };
    });

    this.setState({ owners: newOwners });
  };

  create = async () => {
    let ownerCount = this.state.owners.length
    let required = this.state.required
    if (required > ownerCount || ownerCount < 2) {
      Notification.error({
        message: 'invalid required or number of owners'
      })
    }

    try {
      await this.props.create(this.state.owners, required)
    } catch (e) {
      let eString = e.toString()
      Notification.error({
        message: eString.length > 20 ? 'Something wrong' : eString
      })
    }

  }
}
