pragma solidity ^0.5.0;

contract Owners {
    event OwnerAddition(address indexed _owner, bytes32 _ownerName);
    event OwnerRemoval(address indexed _owner, bytes32 _ownerName);
    event OwnerUpdateName(address indexed _owner, bytes32 _oldOwnerName, bytes32 _newOwnerName);

    mapping (address => uint) public ownerNonce;
    mapping (address => bool) public isOwner;
    mapping (address => bytes32) public ownerName;

    address[] public owners;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "owner only");
        _;
    }

    modifier ownerDoesNotExist(address _owner) {
        require(!isOwner[_owner], "owner already exist");
        _;
    }

    modifier ownerExists(address _owner) {
        require(isOwner[_owner], "owner not exist");
        _;
    }

    function increaseNonce(address _owner)
        internal
        ownerExists(_owner)
        returns(bytes32)
    {
        bytes32 txId = nextTxId(_owner);
        ownerNonce[_owner]++;
        return txId;
    }

    function nextTxId(address _owner)
        public
        view
        ownerExists(_owner)
        returns(bytes32)
    {
        return sha256(abi.encodePacked(_owner, ownerNonce[_owner]));
    }

    function lastTxId(address _owner)
        public
        view
        ownerExists(_owner)
        returns(bytes32)
    {
        require(ownerNonce[_owner] > 0, "no tx found");
        return sha256(abi.encodePacked(_owner, ownerNonce[_owner] - 1));
    }

    function ownersCount()
        public
        view
        returns(uint)
    {
        return owners.length;
    }
}

contract Wallet is Owners{
    event Confirmation(bytes32 indexed transactionId, address sender, uint count);
    event Revocation(bytes32 indexed transactionId, address sender, uint count);
    event Submission(bytes32 indexed transactionId, address sender);
    event ExecutionSuccess(bytes32 indexed transactionId, bytes result);
    event ExecutionFailure(bytes32 indexed transactionId);
    event Deposit(address indexed sender, uint value);
    event RequirementChange(uint required);

    event CoinDistributed(uint ownersCount, uint share);
    event ERC20Distributed(uint ownersCount, uint share);

    mapping (bytes32 => Transaction) public transactions;

    mapping (bytes32 => mapping (address => bool)) public confirmations;

    uint public required;
    uint public executedTxCount;
    uint public pendingTxCount;

    uint256 public deployedAt;

    struct Transaction {
        address destination;
        uint value;
        bytes data;
        bool executed;
        uint count;
        bytes32 description;
    }

    modifier onlyWallet() {
        require(msg.sender == address(this), "only wallet calls itself");
        _;
    }

    modifier transactionExists(bytes32 _transactionId) {
        require(transactions[_transactionId].destination != address(0), "tx not exist");
        _;
    }

    modifier confirmed(bytes32 _transactionId, address _owner) {
        require(confirmations[_transactionId][_owner], "owner not confirmed this tx");
        _;
    }

    modifier notConfirmed(bytes32 _transactionId, address _owner) {
        require(!confirmations[_transactionId][_owner], "owner already confirmed this tx");
        _;
    }

    modifier notExecuted(bytes32 _transactionId) {
        require(!transactions[_transactionId].executed, "tx already executed");
        _;
    }

    modifier notNull(address _address) {
        require(_address != address(0), "address 0x0 not accepted");
        _;
    }

    modifier validRequirement(uint ownerCount, uint _required) {
        require(
            _required <= ownerCount &&
            _required != 0 &&
            ownerCount != 0, "requirements not full filled");
        _;
    }

    /// @dev Fallback function allows to deposit ether.
    function()
        external
        payable
    {
        emit Deposit(msg.sender, msg.value);
    }

    /*
     * Public functions
     */
    /// @dev Contract constructor sets initial _owners and required number of confirmations.
    /// @param _owners List of initial owners.
    /// @param _ownerNames List of initial ownerNames.
    /// @param _required Number of required confirmations.
    constructor (address[] memory _owners, bytes32[] memory _ownerNames, uint _required)
        public
        validRequirement(_owners.length, _required)
    {
        deployedAt = block.number;
        for (uint i = 0; i < _owners.length; i++) {
            if (isOwner[_owners[i]] || _owners[i] == address(0))
                revert("owner duplicate in input");
            isOwner[_owners[i]] = true;
            ownerName[_owners[i]] = _ownerNames[i];
        }
        owners = _owners;
        required = _required;
    }

    /// @dev Allows to add a new _owner. Transaction has to be sent by wallet.
    /// @param _owner Address of new owner.
    /// @param _ownerName Name of new owner.
    function addOwner(address _owner, bytes32 _ownerName)
        public
        onlyWallet
        ownerDoesNotExist(_owner)
        notNull(_owner)
        validRequirement(owners.length + 1, required)
    {
        isOwner[_owner] = true;
        ownerName[_owner] = _ownerName;
        owners.push(_owner);
        emit OwnerAddition(_owner, _ownerName);
    }

    /// @dev Allows to remove an _owner. Transaction has to be sent by wallet.
    /// @param _owner Address of _owner.
    function removeOwner(address _owner)
        public
        onlyWallet
        ownerExists(_owner)
    {
        isOwner[_owner] = false;
        for (uint i = 0; i < owners.length - 1; i++)
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                break;
            }
        owners.length -= 1;
        if (required > owners.length)
            changeRequirement(owners.length);
        emit OwnerRemoval(_owner, ownerName[_owner]);
    }

    /// @dev Allows to replace an owner with a new owner. Transaction has to be sent by wallet.
    /// @param _owner Address of owner to be replaced.
    /// @param _newOwner Address of new owner.
    /// @param _newOwnerName Name of new owner.
    function replaceOwner(address _owner, address _newOwner, bytes32  _newOwnerName)
        public
        onlyWallet
        ownerExists(_owner)
        ownerDoesNotExist(_newOwner)
    {
        for (uint i = 0; i < owners.length; i++)
            if (owners[i] == _owner) {
                owners[i] = _newOwner;
                break;
            }
        isOwner[_owner] = false;
        isOwner[_newOwner] = true;
        emit OwnerRemoval(_owner, ownerName[_owner]);
        emit OwnerAddition(_newOwner, _newOwnerName);
    }

    /// @dev Allows to replace an ownerName with a new ownerName. Transaction has to be sent by wallet.
    /// @param _owner Address of owner to update ownerName.
    /// @param _newOwnerName New owner's name.
    function updateOwnerName(address _owner, bytes32  _newOwnerName)
        public
        onlyWallet
        ownerExists(_owner)
    {
        bytes32 oldOwnerName = ownerName[_owner];
        ownerName[_owner] = _newOwnerName;
        emit OwnerUpdateName(_owner, oldOwnerName, _newOwnerName);
    }

    /// @dev Allows to change the number of required confirmations. Transaction has to be sent by wallet.
    /// @param _required Number of required confirmations.
    function changeRequirement(uint _required)
        public
        onlyWallet
        validRequirement(owners.length, _required)
    {
        required = _required;
        emit RequirementChange(_required);
    }

    /// @dev Allows an owner to submit and confirm a transaction.
    /// @param destination Transaction target address.
    /// @param value Transaction ether value.
    /// @param data Transaction data payload.
    /// @return Returns transaction ID.
    function submitTransaction(address _destination, uint _value, bytes memory _data, bytes32 _description)
        public
        returns (bytes32 transactionId)
    {
        transactionId = addTransaction(_destination, _value, _data, _description);
        confirmTransaction(transactionId);
        pendingTxCount++;
    }

    /// @dev Allows an owner to confirm a transaction.
    /// @param transactionId Transaction ID.
    function confirmTransaction(bytes32 transactionId)
        public
        ownerExists(msg.sender)
        transactionExists(transactionId)
        notConfirmed(transactionId, msg.sender)
    {
        confirmations[transactionId][msg.sender] = true;
        transactions[transactionId].count++;
        emit Confirmation(transactionId, msg.sender, transactions[transactionId].count);
        executeTransaction(transactionId);
    }

    /// @dev Allows an owner to revoke a confirmation for a transaction.
    /// @param _transactionId Transaction ID.
    function revokeConfirmation(bytes32 _transactionId)
        public
        ownerExists(msg.sender)
        confirmed(_transactionId, msg.sender)
        notExecuted(_transactionId)
    {
        confirmations[_transactionId][msg.sender] = false;
        transactions[_transactionId].count--;
        emit Revocation(_transactionId, msg.sender, transactions[_transactionId].count);
    }

    /// @dev Allows anyone to execute a confirmed transaction.
    /// @param _transactionId Transaction ID.
    function executeTransaction(bytes32 _transactionId)
        public
        notExecuted(_transactionId)
    {
        if (isConfirmed(_transactionId)) {
            Transaction storage tx = transactions[_transactionId];
            tx.executed = true;
            (bool success, bytes memory result) = tx.destination.call.value(tx.value)(tx.data);
            if (success) {
                emit ExecutionSuccess(_transactionId, result);
                executedTxCount++;
                pendingTxCount--;
            }
            else {
                emit ExecutionFailure(_transactionId);
                tx.executed = false;
            }
        }
    }

    /// @dev Returns the confirmation status of a transaction.
    /// @param _transactionId Transaction ID.
    /// @return Confirmation status.
    function isConfirmed(bytes32 _transactionId)
        public
        view
        returns (bool)
    {
        return transactions[_transactionId].count >= required;
    }

    /*
     * Internal functions
     */
    /// @dev Adds a new transaction to the transaction mapping, if transaction does not exist yet.
    /// @param _destination Transaction target address.
    /// @param _value Transaction ether value.
    /// @param _data Transaction data payload.
    /// @param _description Transaction description.
    /// @return Returns transaction ID, creator.
    function addTransaction(address _destination, uint _value, bytes memory _data, bytes32 _description)
        internal
        notNull(_destination)
        returns (bytes32 transactionId)
    {
        transactionId = increaseNonce(msg.sender);
        transactions[transactionId] = Transaction({
            destination: _destination,
            value: _value,
            data: _data,
            executed: false,
            count: 0,
            description: _description
        });
        emit Submission(transactionId, msg.sender);
    }

    /// @dev distrubute coins to all owners
    function distributeCoin()
        public
        onlyWallet
    {
        uint share = address(this).balance / ownersCount();
        address owner;
        for (uint i = 0; i < ownersCount(), i++) {
            owner = owner[i];
            owner.transfer(share);
        }
        emit CoinDistributed(ownersCount(), share)
    }

    /// @dev distrubute ERC20 tokens to all owners
    function distributeERC20(address _tokenAddress)
        public
        onlyWallet
    {
    }

    function getConfirmStatus(bytes32 _transactionId, address _owner)
        public
        view
        returns(bool)
    {
        return confirmations[_transactionId][_owner];
    }

    /// @dev Returns array with owner addresses, which confirmed transaction.
    /// @param _transactionId Transaction ID.
    /// @return Returns array of owner addresses.
    function getConfirmations(bytes32 _transactionId)
        public
        view
        returns (address[] memory _confirmations)
    {
        address[] memory confirmationsTemp = new address[](owners.length);
        uint count = 0;
        uint i;
        for (i = 0; i < owners.length; i++)
            if (confirmations[_transactionId][owners[i]]) {
                confirmationsTemp[count] = owners[i];
                count += 1;
            }
        _confirmations = new address[](count);
        for (i = 0; i < count; i++)
            _confirmations[i] = confirmationsTemp[i];
    }
}