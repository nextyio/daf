pragma solidity ^0.5.0;

import "./Wallet.sol";

contract WalletMaster {
    mapping(address => address[]) public trackingWallet;
    mapping(address => mapping(address => bool)) public trackedWallet;

    // constructor (
    // )
    //   public
    // {
    // }

    function create(
        address payable[] memory _owners,
        bytes32[] memory _ownerNames,
        uint _required
    )
        public
        returns (address)
    {
        Wallet wallet = new Wallet(
            _owners,
            _ownerNames,
            _required
        );
        addWallet(address(wallet));
    }

    function addWallet(
        address payable _wallet
    )
        public
    {
        address sender = msg.sender;
        require(!trackedWallet[sender][_wallet],"already in tracking list");
        trackedWallet[sender][_wallet] = true;
        trackingWallet[sender].push(_wallet);
    }

    function removeWallet(
        address payable _wallet
    )
        public
    {
        address sender = msg.sender;
        require(trackedWallet[sender][_wallet],"not in tracking list");
        trackedWallet[sender][_wallet] = false;
        uint count = trackingWallet[sender].length;
        require(count > 0, "list empty");
        for (uint i = 0; i < count; i++) {
            address wallet = trackingWallet[sender][i];
            if (wallet == _wallet) {
                trackingWallet[sender][i] = trackingWallet[sender][trackingWallet[sender].length - 1];
                delete trackingWallet[sender][trackingWallet[sender].length-1];
                trackingWallet[sender].length--;
            }
        }
    }

    function myWallets()
        public
        view
        returns(address[] memory)
    {
        return trackingWallet[msg.sender];
    }

    function isTracked(
        address payable _wallet
    )
        public
        view
        returns(bool)
    {
        return trackedWallet[msg.sender][_wallet];
    }
}