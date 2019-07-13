pragma solidity 0.5.0;

contract Owners {
    event OwnerAddition(address indexed _owner, bytes32 _ownerName);
    event OwnerRemoval(address indexed _owner, bytes32 _ownerName);
    event OwnerUpdateName(address indexed _owner, bytes32 _oldOwnerName, bytes32 _newOwnerName);

    mapping (address => uint) public ownerNonce;
    mapping (address => bool) public isOwner;
    mapping (address => bytes32) public ownerName;

    address[] public owners;

    uint constant public MAX_OWNER_COUNT = 50;

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
    event Confirmation(address indexed sender, bytes32 indexed transactionId);
    event Revocation(address indexed sender, bytes32 indexed transactionId);
    event Submission(bytes32 indexed transactionId);
    event Execution(bytes32 indexed transactionId);
    event ExecutionFailure(bytes32 indexed transactionId);
    event Deposit(address indexed sender, uint value);
    event RequirementChange(uint required);

    mapping (bytes32 => Transaction) public transactions;

    bytes32[] public pendingTxIds;
    bytes32[] public comfirmedTxIds;
    bytes32[] public revertedTxIds;

    mapping (bytes32 => uint) public pendingTxPointer;
    mapping (bytes32 => uint) public comfirmedTxPointer;
    mapping (bytes32 => uint) public revertedTxPointer;

    mapping (bytes32 => mapping (address => bool)) public confirmations;

    uint public required;
    uint public executedTxCount;

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

    modifier transactionExists(bytes32 transactionId) {
        require(transactions[transactionId].destination != address(0), "tx not exist");
        _;
    }

    modifier confirmed(bytes32 transactionId, address owner) {
        require(confirmations[transactionId][owner], "owner not comfirmed this tx");
        _;
    }

    modifier notConfirmed(bytes32 transactionId, address owner) {
        require(!confirmations[transactionId][owner], "owner already comfirmed this tx");
        _;
    }

    modifier notExecuted(bytes32 transactionId) {
        require(!transactions[transactionId].executed, "tx already executed");
        _;
    }

    modifier notNull(address _address) {
        require(_address != address(0), "address 0x0 not accepted");
        _;
    }

    modifier validRequirement(uint ownerCount, uint _required) {
        require(
            ownerCount <= MAX_OWNER_COUNT &&
            _required <= ownerCount &&
            _required != 0 &&
            ownerCount != 0, "requirements not full filled");
        _;
    }

    function()
        external
        payable
    {
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
        emit Confirmation(msg.sender, transactionId);
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
        emit Revocation(msg.sender, _transactionId);
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
            (bool success, ) = tx.destination.call.value(tx.value)(tx.data);
            if (success) {
                emit Execution(_transactionId);
                executedTxCount++;
                addComfirmedTx(_transactionId);
            }
            else {
                emit ExecutionFailure(_transactionId);
                tx.executed = false;
                addRevertedTx(_transactionId);
            }
            removePendingTx(_transactionId);
        }
    }

    function removePendingTx(bytes32 _transactionId)
        private
    {
        uint pointerAt = pendingTxPointer[_transactionId];
        uint count = pendingTxCount();
        bytes32 lastPendingTxId = pendingTxIds[count-1];

        pendingTxPointer[_transactionId] = 0;
        pendingTxPointer[lastPendingTxId] = pointerAt;
        pendingTxIds[pointerAt] = lastPendingTxId;
        delete pendingTxIds[count - 1];
        pendingTxIds.length--;
    }

    function addComfirmedTx(bytes32 _transactionId)
        private
    {
        comfirmedTxIds.push(_transactionId);
        uint count = comfirmedTxCount();
        comfirmedTxPointer[_transactionId] = count - 1;
    }

    function addRevertedTx(bytes32 _transactionId)
        private
    {
        revertedTxIds.push(_transactionId);
        uint count = revertedTxCount();
        revertedTxPointer[_transactionId] = count - 1;
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
    /// @return Returns transaction ID.
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
        pendingTxIds.push(transactionId);
        pendingTxPointer[transactionId] = pendingTxIds.length - 1;
        emit Submission(transactionId);
    }

    /*
     * Web3 call functions
     */
    /// @dev Returns number of confirmations of a transaction.
    /// @param _transactionId Transaction ID.
    /// @return Number of confirmations.
    function getConfirmationCount(bytes32 _transactionId)
        public
        view
        returns (uint count)
    {
        return transactions[_transactionId].count;
    }

    /// @dev Returns list of owners.
    /// @return List of owner addresses.
    function getOwners()
        public
        view
        returns (address[] memory)
    {
        return owners;
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

    /// @dev Returns list of pending transaction IDs in defined range.
    /// @param _from Index start position of pending transaction array.
    /// @param _to Index end position of pending transaction array.
    /// @return Returns array of pending transaction IDs.
    function getPendingTransactionIds(uint _from, uint _to)
        public
        view
        returns (bytes32[] memory)
    {
        uint pendingTxCount = pendingTxCount();
        if (pendingTxCount == 0) return new bytes32[](0);
        uint from = _from >= pendingTxCount ? 0 : _from;
        uint to = (_to < pendingTxCount) && (_to >= _from) ? _to : pendingTxCount-1;
        bytes32[] memory _transactionIds = new bytes32[](to - from + 1);
        for (uint i = from; i <= to; i++)
            _transactionIds[i-from] = pendingTxIds[i];
        return _transactionIds;
    }

    function pendingTxCount()
        public
        view
        returns(uint)
    {
        return pendingTxIds.length;
    }

    /// @dev Returns list of comfirmed transaction IDs in defined range.
    /// @param _from Index start position of comfirmed transaction array.
    /// @param _to Index end position of comfirmed transaction array.
    /// @return Returns array of comfirmed transaction IDs.
    function getComfirmedTransactionIds(uint _from, uint _to)
        public
        view
        returns (bytes32[] memory)
    {
        uint comfirmedTxCount = comfirmedTxCount();
        if (comfirmedTxCount == 0) return new bytes32[](0);
        uint from = _from >= comfirmedTxCount ? 0 : _from;
        uint to = (_to < comfirmedTxCount) && (_to >= _from) ? _to : comfirmedTxCount-1;
        bytes32[] memory _transactionIds = new bytes32[](to - from + 1);
        for (uint i = from; i <= to; i++)
            _transactionIds[i-from] = comfirmedTxIds[i];
        return _transactionIds;
    }

    function comfirmedTxCount()
        public
        view
        returns(uint)
    {
        return comfirmedTxIds.length;
    }

    /// @dev Returns list of reverted transaction IDs in defined range.
    /// @param _from Index start position of reverted transaction array.
    /// @param _to Index end position of reverted transaction array.
    /// @return Returns array of reverted transaction IDs.
    function getRevertedTransactionIds(uint _from, uint _to)
        public
        view
        returns (bytes32[] memory)
    {
        uint revertedTxCount = comfirmedTxCount();
        if (revertedTxCount == 0) return new bytes32[](0);
        uint from = _from >= revertedTxCount ? 0 : _from;
        uint to = (_to < revertedTxCount) && (_to >= _from) ? _to : revertedTxCount-1;
        bytes32[] memory _transactionIds = new bytes32[](to - from + 1);
        for (uint i = from; i <= to; i++)
            _transactionIds[i-from] = revertedTxIds[i];
        return _transactionIds;
    }

    function revertedTxCount()
        public
        view
        returns(uint)
    {
        return revertedTxIds.length;
    }

    function getBalance()
        public
        view
        returns(uint)
    {
        return address(this).balance;
    }

    function currentTime()
        public
        view
        returns(uint)
    {
        return block.timestamp;
    }
}