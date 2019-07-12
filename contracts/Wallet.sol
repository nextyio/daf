pragma solidity 0.5.0;

contract Owners {
    event OwnerAddition(address indexed _owner, string _ownerName);
    event OwnerRemoval(address indexed _owner, string _ownerName);
    event OwnerUpdateName(address indexed _owner, string _oldOwnerName, string _newOwnerName);

    mapping (address => uint) public ownerNonce;
    mapping (address => bool) public isOwner;
    mapping (address => string) public ownerName;

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
    bytes32[] public transactionIds;

    mapping (bytes32 => mapping (address => bool)) public confirmations;

    uint public required;
    uint public executedCount;
    uint public revertCount;

    uint256 public deployedAt;

    struct Transaction {
        address destination;
        uint value;
        bytes data;
        bool executed;
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
    /// @param _required Number of required confirmations.
    constructor (address[] memory _owners, uint _required)
        public
        validRequirement(_owners.length, _required)
    {
        deployedAt = block.number;
        for (uint i = 0; i < _owners.length; i++) {
            if (isOwner[_owners[i]] || _owners[i] == address(0))
                revert("owner duplicate in input");
            isOwner[_owners[i]] = true;
        }
        owners = _owners;
        required = _required;
    }

    /// @dev Allows to add a new _owner. Transaction has to be sent by wallet.
    /// @param _owner Address of new owner.
    /// @param _ownerName Name of new owner.
    function addOwner(address _owner, string memory _ownerName)
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
    function replaceOwner(address _owner, address _newOwner, string memory  _newOwnerName)
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
    function updateOwnerName(address _owner, string memory _newOwnerName)
        public
        onlyWallet
        ownerExists(_owner)
    {
        string storage oldOwnerName = ownerName[_owner];
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
    function submitTransaction(address destination, uint value, bytes memory data)
        public
        returns (bytes32 transactionId)
    {
        transactionId = addTransaction(destination, value, data);
        transactionIds.push(transactionId);
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
        emit Confirmation(msg.sender, transactionId);
        executeTransaction(transactionId);
    }

    /// @dev Allows an owner to revoke a confirmation for a transaction.
    /// @param transactionId Transaction ID.
    function revokeConfirmation(bytes32 transactionId)
        public
        ownerExists(msg.sender)
        confirmed(transactionId, msg.sender)
        notExecuted(transactionId)
    {
        confirmations[transactionId][msg.sender] = false;
        emit Revocation(msg.sender, transactionId);
    }

    /// @dev Allows anyone to execute a confirmed transaction.
    /// @param transactionId Transaction ID.
    function executeTransaction(bytes32 transactionId)
        public
        notExecuted(transactionId)
    {
        if (isConfirmed(transactionId)) {
            Transaction storage tx = transactions[transactionId];
            tx.executed = true;
            (bool success, ) = tx.destination.call.value(tx.value)(tx.data);
            if (success) {
                emit Execution(transactionId);
                executedCount++;
            }
            else {
                emit ExecutionFailure(transactionId);
                tx.executed = false;
                revertCount++;
            }
        }
    }

    /// @dev Returns the confirmation status of a transaction.
    /// @param transactionId Transaction ID.
    /// @return Confirmation status.
    function isConfirmed(bytes32 transactionId)
        public
        view
        returns (bool)
    {
        uint count = 0;
        for (uint i = 0; i < owners.length; i++) {
            if (confirmations[transactionId][owners[i]])
                count += 1;
            if (count >= required)
                return true;
        }
    }

    /*
     * Internal functions
     */
    /// @dev Adds a new transaction to the transaction mapping, if transaction does not exist yet.
    /// @param destination Transaction target address.
    /// @param value Transaction ether value.
    /// @param data Transaction data payload.
    /// @return Returns transaction ID.
    function addTransaction(address destination, uint value, bytes memory data)
        internal
        notNull(destination)
        returns (bytes32 transactionId)
    {
        transactionId = increaseNonce(msg.sender);
        transactions[transactionId] = Transaction({
            destination: destination,
            value: value,
            data: data,
            executed: false
        });
        emit Submission(transactionId);
    }

    /*
     * Web3 call functions
     */
    /// @dev Returns number of confirmations of a transaction.
    /// @param transactionId Transaction ID.
    /// @return Number of confirmations.
    function getConfirmationCount(bytes32 transactionId)
        public
        view
        returns (uint count)
    {
        for (uint i = 0; i < owners.length; i++)
        if (confirmations[transactionId][owners[i]])
            count += 1;
    }

    //TODO
    /// @dev Returns total number of transactions after filers are applied.
    /// @param pending Include pending transactions.
    /// @param executed Include executed transactions.
    /// @return Total number of transactions after filters are applied.
    function getTransactionCount(bool pending, bool executed)
        public
        view
        returns (uint count)
    {
        count = transactionIds.length;
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
    /// @param transactionId Transaction ID.
    /// @return Returns array of owner addresses.
    function getConfirmations(bytes32 transactionId)
        public
        view
        returns (address[] memory _confirmations)
    {
        address[] memory confirmationsTemp = new address[](owners.length);
        uint count = 0;
        uint i;
        for (i = 0; i < owners.length; i++)
            if (confirmations[transactionId][owners[i]]) {
                confirmationsTemp[count] = owners[i];
                count += 1;
            }
        _confirmations = new address[](count);
        for (i = 0; i < count; i++)
            _confirmations[i] = confirmationsTemp[i];
    }

    /// @dev Returns list of transaction IDs in defined range.
    /// @param from Index start position of transaction array.
    /// @param to Index end position of transaction array.
    /// @param pending Include pending transactions.
    /// @param executed Include executed transactions.
    /// @return Returns array of transaction IDs.
    function getTransactionIds(uint from, uint to)
        public
        view
        returns (bytes32[] memory)
    {
        bytes32[] memory _transactionIds = new bytes32[](to - from + 1);
        for (uint i = from; i <= to; i++)
            _transactionIds[i-from] = transactionIds[i];
        return _transactionIds;
    }

    function txCount()
        public
        view
        returns(uint)
    {
        return transactionIds.length;
    }

    function pendingCount()
        public
        view
        returns(uint)
    {
        return txCount() - executedCount - revertCount;
    }

    function getBalance()
        public
        view
        returns(uint)
    {
        return address(this).balance;
    }
}