pragma solidity 0.5.0;

import "./StringUtil.sol";
import "../contracts/MarketplaceSecurity.sol";


/** @title Marketplace. 
  * @author Juho Lehtonen
*/
contract Marketplace is MarketplaceSecurity {

    using StringUtil for string;

    enum UserStatus { Shopper, StoreOwner, Admin, WaitingApproval }

    struct User {
        UserStatus status;
        uint storefrontCount;
        uint index;
    }

    mapping(address => User) private users;
    address[] private userIndex;

    struct Storefront {
        string name;
        uint balance;
        uint productCount;
    }

    uint private constant MAX_STOREFRONT_COUNT = 5;
    mapping(address => Storefront[MAX_STOREFRONT_COUNT]) private storefronts;
    
    struct Product {
        string name;
        uint price;
        uint quantity;
        bytes32 picIpfsHash;
    }

    uint private constant MAX_PRODUCT_COUNT = 10;
    uint private constant MAX_PRODUCT_QUANTITY = 200;
    mapping(address => mapping(uint => Product[MAX_PRODUCT_COUNT])) private products;

    event LogAdminRightsGranted(address addr);
    event LogStoreOwnerRightsGranted(address addr);
    event LogStoreOwnerRightsRequested(address addr);
    event LogDeleteUser(address indexed addr, uint index);
    event LogNewStorefrontCreated(address owner, string name, uint balance, uint productCount);
    event LogStorefrontRemoved(address storeOwner, uint storeIndex);
    event LogNewProductAdded(string name, uint price, uint quantity);
    event LogProductRemoved(address storeOwner, uint storeIndex, uint index);
    event LogPurchaseProduct(address storeOwner, uint storeIndex, uint productIndex, uint quantity);
    event LogWithdraw(address addr, uint storeIndex, uint amount);
    event LogProductPictureIpfsHashAdded(address storeOwner, uint storeIndex, uint index);

    modifier verifyCallerIsAdmin () {
        require(users[msg.sender].status == UserStatus.Admin, "Caller is not admin"); 
        _;
    }

    modifier verifyAddressIsStoreOwnerOrAdmin(address addr) {
        require(users[addr].status == UserStatus.Admin || users[addr].status == UserStatus.StoreOwner, 
        "Address is neither admin nor store owner"); 
        _;
    }

    modifier isNotShopper (address storeOwner) {
        require(users[storeOwner].status != UserStatus.Shopper, "Address is shopper"); 
        _;
    }

    modifier isNotYetStoreOwner (address newStoreOwner) {
        require(users[newStoreOwner].status != UserStatus.StoreOwner, "Address is already store owner"); 
        _;
    }

    modifier isNotAdmin (address newAdmin) {
        require(users[newAdmin].status != UserStatus.Admin, "Address is already admin"); 
        _;
    }

    modifier isUser (address userAddress) {
        require(userIndex.length > 0, "There is no users");
        require(userIndex[users[userAddress].index] == userAddress, "No such user");
        _;
    }

    modifier isNotUser (address userAddress) {
        require(userIndex[users[userAddress].index] != userAddress, "User already exisist");
        _;
    }

    modifier storeIndexExists (uint storefrontCount, uint index) {
        require(storefrontCount > 0 || storefrontCount - 1 < index, "Storefront does not exist.");
        _;
    }

    modifier storefrontMaxCapacityReached (uint storefrontCount) {
        require(storefrontCount < MAX_STOREFRONT_COUNT, "Max storefront count reached.");
        _;
    }

    modifier isValidWithdrawAmount (address storeOwner, uint storeIndex, uint amount) {
        require(amount > 0 && storefronts[storeOwner][storeIndex].balance >= amount, "Invalid withdraw amount");
        _;
    }

    modifier isValidProductPrice (uint price) {
        require(price > 0, "Invalid price");
        _;
    }

    modifier productIndexExists (uint productCount, uint index) {
        require(productCount > 0 || productCount - 1 < index, "Product does not exist.");
        _;
    }

    modifier productMaxCapacityReached (uint productCount) {
        require(productCount < MAX_PRODUCT_COUNT, "Max product count reached for collection.");
        _;
    }

    modifier isValidPurchaseQuantity(uint purchaseQuantity) {
        require(
            purchaseQuantity > 0 && purchaseQuantity <= MAX_PRODUCT_QUANTITY, 
            "Product purchase quantity is invalid");
        _;
    }

    modifier isValidProductQuantity(uint quantity) {
        require(quantity > 0 && quantity <= MAX_PRODUCT_QUANTITY, "Product quantity is invalid");
        _;
    }

    /** @notice Create contract. 
      * @dev Contract creator is always admin.
      */
    constructor() 
    public 
    {
        owner = msg.sender;
        users[msg.sender] = User({status: UserStatus.Admin, storefrontCount: 0, index: userIndex.length});
        userIndex.push(msg.sender);
        emit LogAdminRightsGranted(msg.sender);
    }

    /** @notice Grant store owner rights for user. 
      * @dev Store owner rights can be granted only by admin. Only users that has 
      * requested store owner rights can be promoted. 
      * @param newStoreOwner User address that will be granted with store owner right.
      */
    function addStoreOwner(address newStoreOwner)
    public
    isContractActivated()
    verifyCallerIsAdmin()
    isUser(newStoreOwner)
    isNotYetStoreOwner(newStoreOwner)
    {
        externalEnter();
        users[newStoreOwner].status = UserStatus.StoreOwner;
        emit LogStoreOwnerRightsGranted(newStoreOwner);
        externalLeave();
    }

    /** @notice Grant store admin rights for user. 
      * @dev Admin rights can be granted only by admin. Only users that has 
      * requested store owner rights can be promoted. 
      * @param newAdmin User address that will be granted with admin right.
      */
    function addAdmin(address newAdmin)
    public
    isContractActivated()
    verifyCallerIsAdmin()
    isUser(newAdmin)
    isNotAdmin(newAdmin)
    {
        externalEnter();
        users[newAdmin].status = UserStatus.Admin;
        emit LogAdminRightsGranted(newAdmin);
        externalLeave();
    }

    /** @notice Request store owner rights for caller.
      * @dev Request is needed before shop owner rights can be granted.
      */
    function requestStoreOwnerStatus()
    public
    isContractActivated()
    isNotYetStoreOwner(msg.sender)
    {
        externalEnter();
        users[msg.sender] = User({status: UserStatus.WaitingApproval, storefrontCount: 0, index: userIndex.length});
        userIndex.push(msg.sender);
        emit LogStoreOwnerRightsRequested(msg.sender);
        externalLeave();
    }

    /** @notice Delete registered user. 
      * @dev Last item of the users map will be moved to index that will be removed. 
      * Index is also updated accordingly for the moved item. After that last user 
      * address is removed from the userIndexes.
      */
    function deleteUser(address userAddress) 
    public
    isContractActivated()
    isUser(userAddress)
    {
        externalEnter();
        uint deleteRow = users[userAddress].index;
        address updateKey = userIndex[userIndex.length-1];
        userIndex[deleteRow] = updateKey;
        users[updateKey].index = deleteRow; 
        userIndex.pop();
        users[userAddress].status = UserStatus.Shopper;
        emit LogDeleteUser(userAddress, deleteRow);
        externalLeave();
    }

    /** @notice Get User status for the given address.
      * @param userAddress User's address.
      * @return userStatus Status of the registered user.
      */
    function getUserStatus(address userAddress) 
    public 
    view
    returns (UserStatus userStatus) 
    {
        return users[userAddress].status;
    }

    /** @notice Get all registered users and their statuses. 
      * @dev Returns two arrays. Users array index is corresponding to status array index.
      * @return addrs Array of users' addresses
      * @return statuses Array of users' statuses
      */
    function getUsers() 
    public 
    view
    returns (address[] memory addrs, UserStatus[] memory statuses) 
    {
        uint userCount = userIndex.length;
        statuses = new UserStatus[](userCount);
        addrs = new address[](userCount);
        for (uint i = 0; i < userCount; i++) {
            addrs[i] = userIndex[i];
            statuses[i] = users[userIndex[i]].status;
        }
        return (addrs, statuses);
    }

    /** @notice Add new storefront. 
      * @dev Caller needs to be store owner or admin.
      * @param name Name for new storefront.
      */
    function addStorefront(string memory name) 
    public 
    isContractActivated()
    verifyAddressIsStoreOwnerOrAdmin(msg.sender)
    isValidString(name)
    storefrontMaxCapacityReached(users[msg.sender].storefrontCount)
    {
        externalEnter();
        uint storefrontCount = users[msg.sender].storefrontCount;
        storefronts[msg.sender][storefrontCount] = Storefront(
            {name: name, balance: 0, productCount: 0});
        users[msg.sender].storefrontCount++;
        emit LogNewStorefrontCreated(msg.sender, name, 0, 0);
        externalLeave();
    }

    /** @notice Remove existing storefront owned by store owner. 
      * @dev Caller needs to be store owner or admin. Store owner can remove only 
      * own stores and admin can remove any store.
      * @param storeOwner Store owner's address that has storefront to be removed.
      * @param storeIndex Storefront index that will be removed.
      */
    function removeStorefront(address storeOwner, uint storeIndex) 
    public
    isContractActivated()
    verifyAddressIsStoreOwnerOrAdmin(msg.sender)
    {
        externalEnter();
        // store owner can remove own stores
        if ( users[msg.sender].status == UserStatus.StoreOwner ) {
            handleStorefrontRemoval(msg.sender, storeIndex); 
        }
        // admin can remove every storefront
        else {
            handleStorefrontRemoval(storeOwner, storeIndex);
        }
        emit LogStorefrontRemoved(storeOwner, storeIndex);
        externalLeave();
    }

    /** @notice Add product to specified storefront. 
      * @dev Caller needs to be store owner or admin.
      * @param storeIndex Storefront index that will be removed.
      * @param name Name of product.
      * @param price Price of product.      
      * @param quantity Quantity of product.      
      */
    function addProductToStoreFront(uint storeIndex, string memory name, uint price, uint quantity) 
    public
    isContractActivated()
    verifyAddressIsStoreOwnerOrAdmin(msg.sender)
    storeIndexExists(users[msg.sender].storefrontCount, storeIndex)
    productMaxCapacityReached(storefronts[msg.sender][storeIndex].productCount)
    isValidString(name)
    isValidProductQuantity(quantity)
    isValidProductPrice(price)
    {
        externalEnter();
        uint productCount = storefronts[msg.sender][storeIndex].productCount;
        products[msg.sender][storeIndex][productCount] = Product({
            name: name, price: price, quantity: quantity, picIpfsHash: ""
        });
        storefronts[msg.sender][storeIndex].productCount++;
        emit LogNewProductAdded(name, price, quantity);
        externalLeave();
    }

    /** @notice Remove product from specified storefront.
      * @dev Caller needs to be store owner or admin. Store owner can remove 
      * only own products and admin can remove any product.
      * @param storeOwner Store owner address.
      * @param storeIndex Storefront index that contains product to be removed.
      * @param productIndex Product index that will be removed.
      */
    function removeProductFromStorefront(address storeOwner, uint storeIndex, uint productIndex) 
    public
    isContractActivated()
    verifyAddressIsStoreOwnerOrAdmin(msg.sender)
    {
        externalEnter();
        // store owner can remove own product
        if ( users[msg.sender].status == UserStatus.StoreOwner ) {
            deleteProduct(msg.sender, storeIndex, productIndex);
        } 
        // admin can remove any product
        else {
            deleteProduct(storeOwner, storeIndex, productIndex);
        }
        emit LogProductRemoved(storeOwner, storeIndex, productIndex);
        externalLeave();
    }

    /** @notice Get all products from specified storefront.
      * @dev Returns three arrays: names (in bytes), prices and quantities. 
      * Array indexes is corresponding with each other.
      * @param storeOwner Store owner address.
      * @param storeIndex Storefront index that contains products to be returned.
      * @return names Array of product names in bytes.
      * @return prices Array of product prices.
      * @return quantities Array of product quantities.
      * @return ipfsHash Array of product IPFS hash in bytes.
      */
    function getAllProductsFromStorefront(address storeOwner, uint storeIndex) 
    public
    view
    verifyAddressIsStoreOwnerOrAdmin(storeOwner)
    storeIndexExists(users[storeOwner].storefrontCount, storeIndex)
    returns(bytes memory names, uint[] memory prices, uint[] memory quantities, bytes32[] memory ipfsHashes)
    {
        uint pCount = storefronts[storeOwner][storeIndex].productCount;
        prices = new uint[](pCount);
        quantities = new uint[](pCount);
        ipfsHashes = new bytes32[](pCount);

        for (uint i = 0; i < pCount; i++) {
            Product storage product = products[storeOwner][storeIndex][i];
            prices[i] = product.price;
            quantities[i] = product.quantity;
            ipfsHashes[i] = product.picIpfsHash;
        }
        names = getProductNamesInBytes(storeOwner, storeIndex);
        return (names, prices, quantities, ipfsHashes);
    }

    /** @notice Get all storefronts. 
      * @dev Returns three arrays: names (in bytes), balances and 
      * product count. Array indexes is corresponding with each other.
      * @param storeOwner Store owner address that owns storefronts.
      * @return names Array of storefront names in bytes.
      * @return balances Array of storefront balances.
      * @return productCount Array of storefront product counts
      */
    function getStorefronts(address storeOwner)
    public
    view
    isNotShopper(storeOwner)
    returns(bytes memory names, uint[] memory balances, uint[] memory productCount)
    {
        uint storefrontCount = users[storeOwner].storefrontCount;
        balances = new uint[](storefrontCount);
        productCount = new uint[](storefrontCount);

        for (uint i = 0; i < storefrontCount; i++) {
            Storefront storage sf = storefronts[storeOwner][i];
            balances[i] = sf.balance;
            productCount[i] = sf.productCount;
        }
        return (getStorefrontNamesInBytes(storefrontCount, storeOwner), balances, productCount);
    }

    /** @notice Purchase product.
      * @dev If sended value is bigger than 
      * @param storeOwner Store owner address.
      * @param storeIndex Storefront index that contains product to be purchased.
      * @param productIndex Product index to be purchased.
      * @param quantity Purchase quantity.
      */
    function purchaseProduct(address storeOwner, uint storeIndex, uint productIndex, uint quantity) 
    public 
    payable
    isContractActivated()
    verifyAddressIsStoreOwnerOrAdmin(storeOwner)
    productIndexExists(storefronts[storeOwner][storeIndex].productCount, productIndex) 
    {
        externalEnter();
        Product storage product = products[storeOwner][storeIndex][productIndex];
        
        require(product.quantity >= quantity, "Product quantity is not enough");

        uint priceInTotal = product.price * quantity;

        // check if paid enough
        require(msg.value >= priceInTotal, "Not enough paid");

        handleProductPurchase(storeOwner, storeIndex, productIndex, quantity);
        storefronts[storeOwner][storeIndex].balance += priceInTotal;

        // refund
        uint refund = msg.value - priceInTotal;
        if (refund > 0) {
            msg.sender.transfer(refund);
        }
        emit LogPurchaseProduct(storeOwner, storeIndex, productIndex, quantity);
        externalLeave();
    }

    /** @notice Withdraw funds that have been earned. 
      * @dev User can only withdraw funds from own storefront.
      * @param storeIndex Storefront index where funds will be withdrawed.
      * @param amount Amount of funds that will be withdrawed from the storefront.
      */
    function withdrawFunds(uint storeIndex, uint amount) 
    public 
    payable
    isContractActivated()
    isWithdrawalAllowed()
    verifyAddressIsStoreOwnerOrAdmin(msg.sender)
    storeIndexExists(users[msg.sender].storefrontCount, storeIndex)
    isValidWithdrawAmount(msg.sender, storeIndex, amount)
    {
        externalEnter();
        storefronts[msg.sender][storeIndex].balance = storefronts[msg.sender][storeIndex].balance - amount;
        msg.sender.transfer(amount);
        emit LogWithdraw(msg.sender, storeIndex, amount);
        externalLeave();
    }

    /** @notice Withdraw all funds in case of emergency. 
      * @dev Contract should be deactivated before function call.
      * This function can be called only contract owner.
      */
    function emergencyWithdraw() 
    public 
    payable
    isOwner()
    isContractDeactivated()
    {
        externalEnter();
        // collect users' balances
        uint userCount = userIndex.length;
        uint contractBalance = 0;
        for (uint i = 0; i < userCount; i++) {
            contractBalance += getUserBalance(userIndex[i]);
        }

        // set empty balances
        for (uint k = 0; k < userCount; k++) {
            address userAddress = userIndex[k];
            uint storefrontCount = users[userAddress].storefrontCount;
            for (uint l = 0; l < storefrontCount; l++) {
                storefronts[userAddress][l].balance = 0;
            }
        }

        // withdraw everything
        address payable ownerPayable = address(uint160(owner));
        if (contractBalance > 0) {
            ownerPayable.transfer(contractBalance);
        }
        externalLeave();
    }

    /** @notice Get combined balance of storefronts for user.
      * @param userAddress User's address that owns storefront.
      * @return combinedBalance Combined balance of storefronts for the given user.
      */
    function getUserBalance(address userAddress) 
    public
    view
    isUser(userAddress)
    returns (uint combinedBalance)
    {
        uint storefrontCount = users[userAddress].storefrontCount;
        uint totalBalance = 0;
        for (uint i = 0; i < storefrontCount; i++) {
            totalBalance += storefronts[userAddress][i].balance;
        }
        return totalBalance;
    }

    /** @notice Update product price. 
      * @dev Only store owner can update own products' prices.
      * @param storeIndex Storefront index that contains product to be updated.
      * @param productIndex Product index that will be updated.
      * @param newPrice New price for the product.
      */
    function updatePrice(uint storeIndex, uint productIndex, uint newPrice) 
    public
    isContractActivated()
    verifyAddressIsStoreOwnerOrAdmin(msg.sender)
    storeIndexExists(users[msg.sender].storefrontCount, storeIndex)
    isValidProductPrice(newPrice)
    {
        externalEnter();
        products[msg.sender][storeIndex][productIndex].price = newPrice;
        externalLeave();
    }

    /** @notice Update IPFS hash code for the product picture.
      * @dev Picture hash is initialized as empty when product is created. Hash is in hex format
      * without "Qm" prefix so it fits to bytes32. 
      * Picture hash needs to be added afterwards.
      * @param storeIndex Storefront index that contains product to be updated.
      * @param productIndex Product index that will be updated.
      * @param picIpfsHash Product picture hash in IPFS
      */
    function updateIpfsHashForProductPic(uint storeIndex, uint productIndex, bytes32 picIpfsHash) 
    public
    isContractActivated()
    verifyAddressIsStoreOwnerOrAdmin(msg.sender)
    storeIndexExists(users[msg.sender].storefrontCount, storeIndex)
    {
        externalEnter();
        products[msg.sender][storeIndex][productIndex].picIpfsHash = picIpfsHash;
        emit LogProductPictureIpfsHashAdded(msg.sender, storeIndex, productIndex);
        externalLeave();
    }

    /** @notice Get storefront names in bytes. 
      * @dev Iterate through strorefronts and transfer names into bytes.
      * @return serialized Names array in bytes.
      */
    function getStorefrontNamesInBytes(uint storefrontCount, address storeOwner) 
    private 
    view 
    returns(bytes memory serialized)
    {
        uint offset = 64*storefrontCount;
        
        bytes memory buffer = new bytes(offset);
        string memory str = new string(32);

        for (uint i = storefrontCount - 1; i < storefrontCount; i--) {
            str = storefronts[storeOwner][i].name;
            
            StringUtil.stringToBytes(offset, bytes(str), buffer);
            offset -= str.getSize();
        }
        
        return (buffer);
    }

    /** @notice Delete product from the collection.
      * @param productIndex Product index that will be removed.
      */
    function deleteProduct(address storeOwner, uint storeIndex, uint productIndex) 
    private
    storeIndexExists(users[storeOwner].storefrontCount, storeIndex)
    productIndexExists(storefronts[storeOwner][storeIndex].productCount, productIndex) 
    {
        uint lastIndexBeforeRemoval = storefronts[storeOwner][storeIndex].productCount - 1;
        Product memory lastProduct = products[storeOwner][storeIndex][lastIndexBeforeRemoval];
        
        if (lastIndexBeforeRemoval > 0) {
            products[storeOwner][storeIndex][productIndex] = lastProduct;
        }
        storefronts[storeOwner][storeIndex].productCount--;
    }

    /** @notice Handle product purchase book keeping.
      * @param index Product index to be purchased.
      * @param purchaseQuantity Purchase quantity.
      */
    function handleProductPurchase(address storeOwner, uint storeIndex, uint index, uint purchaseQuantity)
    private
    productIndexExists(storefronts[storeOwner][storeIndex].productCount, index)
    {
        Product storage product = products[storeOwner][storeIndex][index];
        uint existingQuantity = product.quantity;
        if (existingQuantity - purchaseQuantity == 0) {
            deleteProduct(storeOwner, storeIndex, index);
        } else {
            products[storeOwner][storeIndex][index].quantity = existingQuantity - purchaseQuantity;
        }
    }

    /** @notice Get product names in bytes. 
      * @dev Iterate through products and transfer names into bytes.
      * @return serialized Names array in bytes.
      */
    function getProductNamesInBytes(address storeOwner, uint storeIndex) 
    private 
    view 
    returns(bytes memory serialized)
    {
        uint pCount = storefronts[storeOwner][storeIndex].productCount;
        uint offset = 64*pCount;
        
        bytes memory buffer = new bytes(offset);
        string memory str = new string(32);

        for (uint i = pCount - 1; i < pCount; i--) {
            str = products[storeOwner][storeIndex][i].name;
            
            StringUtil.stringToBytes(offset, bytes(str), buffer);
            offset -= str.getSize();
        }
        
        return (buffer);
    }

    /** @notice Remove existing storefront.
      * @param storeIndex Storefront index that will be removed.
      */
    function handleStorefrontRemoval(address storeOwner, uint storeIndex) 
    private
    storeIndexExists(users[storeOwner].storefrontCount, storeIndex)
    {
        uint lastIndexBeforeRemoval = users[storeOwner].storefrontCount - 1;
        Storefront memory lastStore = storefronts[storeOwner][lastIndexBeforeRemoval];
        storefronts[storeOwner][storeIndex] = lastStore;
        users[storeOwner].storefrontCount--;
    }
}