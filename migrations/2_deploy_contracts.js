var Wallet = artifacts.require('./Wallet.sol');

function fillBytes32(text) {
    let s = text.split('x')[1]
    let len = s.length
    let toFill = 32-len
    for (let i = 1; i <= toFill; i++)
        s = '0' + s
    return '0x' + s
}

module.exports = async function (deployer) {
    let owners = ['0x95e2fcBa1EB33dc4b8c6DCBfCC6352f0a253285d']
    let ownerNames = ['testacc']
    let toBytes32 = ownerNames.map((ownerName) => fillBytes32(web3.utils.asciiToHex(ownerName)))
    let required = Number((owners.length / 2).toFixed(0))
    await deployer.deploy(
        Wallet,
        owners,
        toBytes32,
        required,
    ) 
}