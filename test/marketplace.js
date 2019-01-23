const Marketplace = artifacts.require("./Marketplace.sol");
//var Translator = require('./utils/translator.js');
//const testUtil = require('solidity-test-util');
//var bs58 = require('bs58');

contract("Marketplace", accounts => {

  const owner = accounts[0];
  const storeOwner = accounts[1];
  const buyer = accounts[2];
  const storeOwner2 = accounts[3];
  const shopper = accounts[4];
  const price = web3.utils.toWei("1", "ether");

  // Address that creates contract should be granted with admin rights.
  // This way we ensure that creator has access to admin functionality.
  it("Contract owner should be admin", async () => {
    const marketplaceInstance = await Marketplace.deployed();

    const userStatus = await marketplaceInstance.getUserStatus.call(owner);

    assert.equal(parseInt(userStatus), 2, "Contract owner should always be admin");
  });

  // Admin should be able to give shop owner and admin rights for user. User needs
  // to request shop owner rights first. This way we ensure that there will
  // sellers in the marketplace.
  it("Admin can grant rights for store owners", async () => {
    const marketplaceInstance = await Marketplace.deployed();

    await marketplaceInstance.requestStoreOwnerStatus({ from: storeOwner });
    await marketplaceInstance.addStoreOwner(storeOwner, { from: owner });

    const userStatus = await marketplaceInstance.getUserStatus.call( storeOwner );
    assert.equal(parseInt(userStatus), 1, "Store owner status in not granted for user");

    await marketplaceInstance.addAdmin(storeOwner, { from: owner });
    const adminStatus = await marketplaceInstance.getUserStatus.call( storeOwner );
    assert.equal(parseInt(adminStatus), 2, "Admin status in not granted for user");

  });

  // Users with "Store owner" or "Admin" status should be able to add new storefronts and
  // remove them. In storefront removal process last storefront is moved to replace storefront that is 
  // removed and then count will be decreased. So storefront index will be changing. Replacement 
  // is done to safe gas costs. Admin may also want to sell something.
  it("Store owner and admin can add and remove storefronts", async () => {
    const marketplaceInstance = await Marketplace.new();

    await marketplaceInstance.requestStoreOwnerStatus({ from: storeOwner });
    await marketplaceInstance.addStoreOwner(storeOwner, { from: owner });

    const storeFrontName1 = "Fruit store";
    const storeFrontName2 = "Weapon store";
    const storeFrontName3 = "Game store";

    await marketplaceInstance.addStorefront( storeFrontName1, { from: storeOwner } );
    await marketplaceInstance.addStorefront( storeFrontName2, { from: storeOwner } );
    await marketplaceInstance.addStorefront( storeFrontName3, { from: storeOwner } );

    await marketplaceInstance.addStorefront( storeFrontName1, { from: owner } );

    const storeFrontsBeforeRemoval = await marketplaceInstance.getStorefronts.call(storeOwner, { from: storeOwner });
    const storefrontsNamesBeforeRemoval = convertToStringArray(storeFrontsBeforeRemoval[0]);

    assert.equal(parseInt(storeFrontsBeforeRemoval[1].length), 3, "Storefront count for store owner should be 3");
    assert.equal(storefrontsNamesBeforeRemoval[0], storeFrontName1, "Product name should match");
    assert.equal(storefrontsNamesBeforeRemoval[1], storeFrontName2, "Product name should match");
    assert.equal(storefrontsNamesBeforeRemoval[2], storeFrontName3, "Product name should match");

    const adminsStoreFrontsBeforeRemoval = await marketplaceInstance.getStorefronts.call(owner, { from: owner });
    assert.equal(parseInt(adminsStoreFrontsBeforeRemoval[1].length), 1, "Storefront count for admin should be 1");

    await marketplaceInstance.removeStorefront(owner, 0);
    await marketplaceInstance.removeStorefront(storeOwner, 0);

    const storeFrontsAfterRemoval = await marketplaceInstance.getStorefronts.call(storeOwner, { from: storeOwner });
    const storefrontsNamesAfterRemoval = convertToStringArray(storeFrontsAfterRemoval[0]);

    assert.equal(parseInt(storeFrontsAfterRemoval[1].length), 2, "Storefront count for store owner should be 2");
    assert.equal(storefrontsNamesAfterRemoval[0], storeFrontName3, "Product name should match");
    assert.equal(storefrontsNamesAfterRemoval[1], storeFrontName2, "Product name should match");

    const adminsStoreFrontsAfterRemoval = await marketplaceInstance.getStorefronts.call(owner, { from: owner });
    assert.equal(parseInt(adminsStoreFrontsAfterRemoval[1].length), 0, "Storefront count for admin should be 0 after removal");
  });

  // After user has requested Store owner status, user status should be
  // 'WaitingApproval'. After request admin can grant shop owner rights. 
  // This way we store the info that user has made request.
  it("Request store owner status and get all users", async () => {
    const marketplaceInstance = await Marketplace.new();

    await marketplaceInstance.requestStoreOwnerStatus({ from: shopper });

    const usersBefore = await marketplaceInstance.getUsers.call({ from: owner });
 
    assert.equal(usersBefore[0][0], owner, "User address should be contract owner");
    assert.equal(parseInt(usersBefore[1][0]), 2, "Status should admin");
    assert.equal(usersBefore[0][1], shopper, "User address should be shopper");
    assert.equal(parseInt(usersBefore[1][1]), 3, "Status should be 'Waiting for approval'");

    await marketplaceInstance.addStoreOwner(shopper, { from: owner });

    const usersAfter = await marketplaceInstance.getUsers.call({ from: owner });

    assert.equal(usersAfter[0][0], owner, "User address should be contract owner");
    assert.equal(parseInt(usersAfter[1][0]), 2, "Status should admin");
    assert.equal(usersAfter[0][1], shopper, "User address should be shopper");
    assert.equal(parseInt(usersAfter[1][1]), 1, "Status should shop owner");
  });

  // Store owner should be able add remove products. In product removal process last product 
  // is moved to replace product that is removed and then count will be decreased. So product index 
  // will be changing. Replacement is done to safe gas costs. Products should be able
  // fetch with one query to avoid multiple queries. Names will be returned as bytes,
  // prices and quantities in arrays.
  it("Add and remove products", async () => {
    const marketplaceInstance = await Marketplace.new();

    await marketplaceInstance.requestStoreOwnerStatus({ from: storeOwner });
    await marketplaceInstance.addStoreOwner(storeOwner, { from: owner });

    const storeFrontName = "Fruit store";
    await marketplaceInstance.addStorefront( storeFrontName, { from: storeOwner } );

    const storefronts = await marketplaceInstance.getStorefronts(storeOwner, { from: storeOwner });
    const count = storefronts[1].length;
    const lastIndex = parseInt(count) - 1;
    const productName1 = "One";
    const productName2 = "Two";
    const productName3 = "Three";

    const price = web3.utils.toWei("1", "ether");
    const quantity = 1;

    await marketplaceInstance.addProductToStoreFront(lastIndex, productName1, price, quantity, { from: storeOwner })
    await marketplaceInstance.addProductToStoreFront(lastIndex, productName2, price, quantity, { from: storeOwner })
    await marketplaceInstance.addProductToStoreFront(lastIndex, productName3, price, quantity, { from: storeOwner })
    
    const productsBeforeRemoval = await marketplaceInstance.getAllProductsFromStorefront(storeOwner, lastIndex, { from: storeOwner });
    const productNamesBeforeRemoval = convertToStringArray(productsBeforeRemoval[0]);
    
    assert.equal(productNamesBeforeRemoval.length, 3, "Product count doesn't match");
    assert.equal(productNamesBeforeRemoval[0], productName1, "Product name should match");
    assert.equal(parseInt(productsBeforeRemoval[1][0]), price, "Product price should match");
    assert.equal(productNamesBeforeRemoval[1], productName2, "Product name should match");
    assert.equal(parseInt(productsBeforeRemoval[1][1]), price, "Product price should match");
    assert.equal(productNamesBeforeRemoval[2], productName3, "Product name should match");
    assert.equal(parseInt(productsBeforeRemoval[1][2]), price, "Product price should match");

    await marketplaceInstance.removeProductFromStorefront(storeOwner, lastIndex, 0, { from: storeOwner });

    const productsAfterRemoval = await marketplaceInstance.getAllProductsFromStorefront(storeOwner, lastIndex, { from: storeOwner });
    const productNamesAfterRemoval = convertToStringArray(productsAfterRemoval[0]);

    assert.equal(productNamesAfterRemoval.length, 2, "Product count doesn't match");
    assert.equal(productNamesAfterRemoval[0], productName3, "Product name should match");
    assert.equal(parseInt(productsAfterRemoval[1][0]), price, "Product price should match");
    assert.equal(productNamesAfterRemoval[1], productName2, "Product name should match");
    assert.equal(parseInt(productsAfterRemoval[1][1]), price, "Product price should match");
  });

  // Once existing user is deleted, user should be able to request shop owner rights back.
  // This way we can block shop owner if detect disorder behaviour.
  it("Delete existing user and request again store owner rights", async () => {
    const marketplaceInstance = await Marketplace.new();

    await marketplaceInstance.requestStoreOwnerStatus({ from: storeOwner });
    await marketplaceInstance.addStoreOwner(storeOwner, { from: owner });
    
    const usersBeforeDelete = await marketplaceInstance.getUsers.call();
    assert.equal(parseInt(usersBeforeDelete[1].length), 2, "User count should be 2 after addition");

    await marketplaceInstance.deleteUser(storeOwner);

    const usersAfterDelete = await marketplaceInstance.getUsers.call();
    assert.equal(parseInt(usersAfterDelete[1].length), 1, "User count should be 1 after addition");

    const userStatusAfter = await marketplaceInstance.getUserStatus.call(storeOwner);
    assert.equal(parseInt(userStatusAfter), 0, "User status should be shopper after delete");

    await marketplaceInstance.requestStoreOwnerStatus({ from: storeOwner });
  });

  // Users should be able to purchase products. If too much is paid, rest will be refunded
  // to buyers address. This way we ensure that user doesn't pay too much. If products quantity
  // is sold out (quantity=0), product count will be shown as 0.
  it("Purchase product from storefront and refund", async () => {
    const marketplaceInstance = await Marketplace.new();

    await marketplaceInstance.requestStoreOwnerStatus({ from: storeOwner });
    await marketplaceInstance.addStoreOwner(storeOwner, { from: owner });

    const storeFrontName = "Fruit store";
    await marketplaceInstance.addStorefront( storeFrontName, { from: storeOwner } );

    const productName = "banana";
    const price = web3.utils.toWei("1", "ether");
    const quantity = 1;
    await marketplaceInstance.addProductToStoreFront(0, productName, price, quantity, { from: storeOwner })

    const productIndex = 0;
    const storeIndex = 0;
    const payment = web3.utils.toWei("2", "ether");
    var buyerBalanceBefore = await web3.eth.getBalance(buyer);
    await marketplaceInstance.purchaseProduct(storeOwner, storeIndex, productIndex, quantity, {from: buyer, value: payment});

    const productsAfterPurchase = await marketplaceInstance.getAllProductsFromStorefront(storeOwner, 0, { from: storeOwner });
    var buyerBalanceAfter = await web3.eth.getBalance(buyer);
    const stores = await marketplaceInstance.getStorefronts.call(storeOwner, { from: storeOwner });

    assert.equal(productsAfterPurchase[1].length, 0, "Purchased product should be removed quantity is zero");
    assert.equal(parseInt(stores[1][storeIndex]), price, "Storefront account balance doesn't match");
    assert.isAbove(parseInt(buyerBalanceAfter), parseInt(buyerBalanceBefore) - payment, "After refund buyer balance should be more than balance - (payment + gas cost )");
  });

  // Store owner should be able to update product price.
  // If the demand for product is big, then store owner can increase price.
  it("Update product price and update IPFS hash of product picture in storefront", async () => {
    const marketplaceInstance = await Marketplace.new();

    await marketplaceInstance.requestStoreOwnerStatus({ from: storeOwner });
    await marketplaceInstance.addStoreOwner(storeOwner, { from: owner });

    const storeFrontName = "Fruit store";
    await marketplaceInstance.addStorefront( storeFrontName, { from: storeOwner } );

    const productName = "banana";
    const price = web3.utils.toWei("1", "ether");
    const updatedPrice = web3.utils.toWei("2", "ether");
    const quantity = 1;
    const ipfsPictureHashHex = "0x79065c5acd65a299993f8fd12496c9cad810388ee6cec6bee0595dfd6f74e2e5";
    const emptyPictureHashHex = "0x0000000000000000000000000000000000000000000000000000000000000000";

    await marketplaceInstance.addProductToStoreFront(0, productName, price, quantity, { from: storeOwner })
    const productsBeforePriceUpdate = await marketplaceInstance.getAllProductsFromStorefront(storeOwner, 0, { from: storeOwner });
    assert.equal(parseInt(productsBeforePriceUpdate[1][0]), price, "Product price should 1 ether");
    assert.equal(parseInt(productsBeforePriceUpdate[3][0]), emptyPictureHashHex, "Product should not have IPFS hash by default");
    
    await marketplaceInstance.updatePrice(0, 0, updatedPrice, { from: storeOwner });
    await marketplaceInstance.updateIpfsHashForProductPic(0, 0, ipfsPictureHashHex, { from: storeOwner }); 

    const productsAfterPriceUpdate = await marketplaceInstance.getAllProductsFromStorefront(storeOwner, 0, { from: storeOwner });
    assert.equal(parseInt(productsAfterPriceUpdate[1][0]), updatedPrice, "Product price should be updated to 2 ether");
    assert.equal(parseInt(productsAfterPriceUpdate[3][0]), ipfsPictureHashHex, "Product should not have IPFS hash by default");
  });

  // Shop owner should be able withdraw funds from storefronts. Every storefront have own balance.
  it("Withdraw funds from storefront", async () => {
    const marketplaceInstance = await Marketplace.new();

    await marketplaceInstance.requestStoreOwnerStatus({ from: storeOwner });
    await marketplaceInstance.addStoreOwner(storeOwner, { from: owner });

    const storeFrontName = "Fruit store";
    await marketplaceInstance.addStorefront( storeFrontName, { from: storeOwner } );

    const productName = "banana";
    const price = web3.utils.toWei("1", "ether");
    const quantity = 1;
    await marketplaceInstance.addProductToStoreFront(0, productName, price, quantity, { from: storeOwner })

    const productIndex = 0;
    const storeIndex = 0;
    const payment = web3.utils.toWei("2", "ether");

    await marketplaceInstance.purchaseProduct(storeOwner, storeIndex, productIndex, quantity, {from: buyer, value: payment});

    const stores = await marketplaceInstance.getStorefronts.call(storeOwner, { from: storeOwner });
    assert.equal(parseInt(stores[1][storeIndex]), price, "Storefront account balance doesn't match");

    var ownerBalanceBefore = await web3.eth.getBalance(storeOwner);
    const tx = await marketplaceInstance.withdrawFunds(storeIndex, price, {from: storeOwner});

    var ownerBalanceAfter = await web3.eth.getBalance(storeOwner);
    assert.isTrue( parseInt(ownerBalanceBefore) < parseInt(ownerBalanceAfter), "Balance should be bigger after withdraw");
  });

    // In case of emergency, contract owner should be able to deactivate contract and withdraw all 
    // the funds from the storefronts to contract owner's address
    it("Contract owner can deactivate contract and withdraw funds", async () => {
      const marketplaceInstance = await Marketplace.new();
  
      await marketplaceInstance.requestStoreOwnerStatus({ from: storeOwner });
      await marketplaceInstance.addStoreOwner(storeOwner, { from: owner });
  
      const storeFrontName = "Fruit store";
      await marketplaceInstance.addStorefront( storeFrontName, { from: storeOwner } );
  
      const productName = "banana";
      const price = web3.utils.toWei("1", "ether");
      const quantity = 1;
      await marketplaceInstance.addProductToStoreFront(0, productName, price, quantity, { from: storeOwner })
  
      const productIndex = 0;
      const storeIndex = 0;
      const payment = web3.utils.toWei("2", "ether");
  
      await marketplaceInstance.purchaseProduct(storeOwner, storeIndex, productIndex, quantity, {from: buyer, value: payment});
  
      const stores = await marketplaceInstance.getStorefronts.call(storeOwner, { from: storeOwner });
      assert.equal(parseInt(stores[1][storeIndex]), price, "Storefront account balance doesn't match");
  
      var ownerBalanceBefore = await web3.eth.getBalance(owner);
      
      await marketplaceInstance.toggleContractActive({from: owner});
      await marketplaceInstance.emergencyWithdraw({from: owner});
  
      var ownerBalanceAfter = await web3.eth.getBalance(owner);
      assert.isTrue( parseInt(ownerBalanceBefore) < parseInt(ownerBalanceAfter), "Balance should be bigger after withdraw");
  });

  // Emergency withdraw function is available for contract owner only if contract is deactivated.
  it("Emergency withdraw function should be callable only if contract is deactivated", async () => {
      const marketplaceInstance = await Marketplace.deployed();
      try {
        await marketplaceInstance.emergencyWithdraw({from: owner});
        assert.fail("The emergencyWithdraw function should have thrown an error");
      }
      catch (err) {
        assert.include(err.message, "revert", "The error message should contain 'revert'");
      }
  });

  // User should be able to get combined storefront balance.
  // This way user has good view about overall balance.
  it("Get combined storefront balance by user", async () => {
    const marketplaceInstance = await Marketplace.new();

    await marketplaceInstance.requestStoreOwnerStatus({ from: storeOwner });
    await marketplaceInstance.addStoreOwner(storeOwner, { from: owner });

    await marketplaceInstance.addStorefront( "Fruit store", { from: storeOwner } );

    const price = web3.utils.toWei("1", "ether");
    const quantity = 1;
    await marketplaceInstance.addProductToStoreFront(0, "banana", price, quantity, { from: storeOwner })

    await marketplaceInstance.addStorefront( "Tool store", { from: storeOwner } );
    await marketplaceInstance.addProductToStoreFront(1, "hammer", price, quantity, { from: storeOwner });

    const productIndex = 0;
    await marketplaceInstance.purchaseProduct(storeOwner, 0, productIndex, quantity, {from: buyer, value: price});
    await marketplaceInstance.purchaseProduct(storeOwner, 1, productIndex, quantity, {from: buyer, value: price});
    
    const totalBalance = await marketplaceInstance.getUserBalance.call(storeOwner);
    assert.equal(parseInt(totalBalance), price * 2, "User balance doesn't match");
  });

  // Get mass of products at once so there is no need make separate query for every product.
  it("Get all products from storefront", async () => {
    const marketplaceInstance = await Marketplace.new();

    await marketplaceInstance.requestStoreOwnerStatus({ from: storeOwner });
    await marketplaceInstance.addStoreOwner(storeOwner, { from: owner });
    const storeName = "Fruit store";
    await marketplaceInstance.addStorefront( storeName, { from: storeOwner } );
    
    const name = "banana";
    const name2 = "orange";
    const name3 = "kiwi";
    const name4 = "lemon";
    const name5 = "melon";
    
    const quantity = 1;
    const quantity2 = 2;
    const quantity3 = 3;
    const quantity4 = 4;
    const quantity5 = 5;
    const storeIndex = 0;
    
    await marketplaceInstance.addProductToStoreFront(storeIndex, name, price, quantity, { from: storeOwner });
    await marketplaceInstance.addProductToStoreFront(storeIndex, name2, price, quantity2, { from: storeOwner });
    await marketplaceInstance.addProductToStoreFront(storeIndex, name3, price, quantity3, { from: storeOwner });
    await marketplaceInstance.addProductToStoreFront(storeIndex, name4, price, quantity4, { from: storeOwner });
    await marketplaceInstance.addProductToStoreFront(storeIndex, name5, price, quantity5, { from: storeOwner });

    const products = await marketplaceInstance.getAllProductsFromStorefront.call(storeOwner, storeIndex);
    const productNames = convertToStringArray(products[0]);

    assert.equal(productNames[0], name, "Product name does not match");
    assert.equal(parseInt(products[1][0]), price, "Product price does not match");
    assert.equal(parseInt(products[2][0]), quantity, "Product quantity does not match");

    assert.equal(productNames[1], name2, "Product name does not match");
    assert.equal(parseInt(products[1][1]), price, "Product price does not match");
    assert.equal(parseInt(products[2][1]), quantity2, "Product quantity does not match");

    assert.equal(productNames[2], name3, "Product name does not match");
    assert.equal(parseInt(products[1][2]), price, "Product price does not match");
    assert.equal(parseInt(products[2][2]), quantity3, "Product quantity does not match");

    assert.equal(productNames[3], name4, "Product name does not match");
    assert.equal(parseInt(products[1][3]), price, "Product price does not match");
    assert.equal(parseInt(products[2][3]), quantity4, "Product quantity does not match");

    assert.equal(productNames[4], name5, "Product name does not match");
    assert.equal(parseInt(products[1][4]), price, "Product price does not match");
    assert.equal(parseInt(products[2][4]), quantity5, "Product quantity does not match");
  });
  
  // User should be able to query easily users that is able add storefronts.
  // With store owners we can query all the existing storefronts. This way we can
  // iterate all the existing storefronts in UI code.
  it("Get all storefront owners and existing storefronts", async () => {
    const marketplaceInstance = await Marketplace.new();

    await marketplaceInstance.requestStoreOwnerStatus({ from: storeOwner });
    await marketplaceInstance.addStoreOwner(storeOwner, { from: owner });
    await marketplaceInstance.requestStoreOwnerStatus({ from: storeOwner2 });
    await marketplaceInstance.addStoreOwner(storeOwner2, { from: owner });

    const users = await marketplaceInstance.getUsers.call();
    const owners = getUsersThatCanAddStorefronts(users);

    assert.equal(owners[0], owner, "Contract owner should be consider as store owner");
    assert.equal(owners[1], storeOwner, "Store owner not found");
    assert.equal(owners[2], storeOwner2, "Store owner not found");

    const storeName = "Fruit store";
    const storeName2 = "Tool shop";
    await marketplaceInstance.addStorefront( storeName, { from: storeOwner } );
    await marketplaceInstance.addStorefront( storeName2, { from: storeOwner } );

    const name = "banana";
    const name2 = "orange";

    const quantity = 1;
    const quantity2 = 2;
    const storeIndex = 0;
    await marketplaceInstance.addProductToStoreFront(storeIndex, name, price, quantity, { from: storeOwner });
    await marketplaceInstance.addProductToStoreFront(storeIndex, name2, price, quantity2, { from: storeOwner });

    let existingStorefronts = [];

    for (var i = 0; i < owners.length; i++)
    {
      const storeFrontOwner = owners[i];
      const storefronts = await marketplaceInstance.getStorefronts(storeFrontOwner);
      if (storefronts[2].length > 0) {
        const names = convertToStringArray(storefronts[0]);
        for (var j = 0; j < storefronts[2].length; j++) 
        {
          existingStorefronts.push({owner: storeFrontOwner, name: names[j], balance: parseInt(storefronts[1][j]), productCount: parseInt(storefronts[2][j])});
        }
      }
    }

    assert.equal(existingStorefronts[0].owner, storeOwner, "Store is incorrect");
    assert.equal(existingStorefronts[0].name, storeName, "Store name is incorrect");
    assert.equal(existingStorefronts[0].balance, 0, "Store balance should be zero");
    assert.equal(existingStorefronts[0].productCount, 2, "Product count should be two");

    assert.equal(existingStorefronts[1].owner, storeOwner, "Store is incorrect");
    assert.equal(existingStorefronts[1].name, storeName2, "Store name is incorrect");
    assert.equal(existingStorefronts[1].balance, 0, "Store balance should be zero");
    assert.equal(existingStorefronts[1].productCount, 0, "Product count should be two");
  });


  // Common test for logging events. Let's make sure that we don't break UI interaction
  // because UI is updated based on this events. Remember to update UI side as well if Log 
  // event has been changed.
  it("Log events for the UI", async () => {
    const marketplaceInstance = await Marketplace.new();

    const requestStoreOwnerStatusTx = await marketplaceInstance.requestStoreOwnerStatus({ from: storeOwner });
    assert.equal(requestStoreOwnerStatusTx.logs[0].event, "LogStoreOwnerRightsRequested", "Event not emitted");
    assert.equal(requestStoreOwnerStatusTx.logs[0].args.addr, storeOwner, "User address that requested store owner rights not found");

    const addStoreOwnerTx = await marketplaceInstance.addStoreOwner(storeOwner, { from: owner });
    assert.equal(addStoreOwnerTx.logs[0].event, "LogStoreOwnerRightsGranted", "Event not emitted");
    assert.equal(addStoreOwnerTx.logs[0].args.addr, storeOwner, "User address that got store owner rights not found");

    const addAdminTx = await marketplaceInstance.addAdmin( storeOwner, { from: owner } );
    assert.equal(addAdminTx.logs[0].event, "LogAdminRightsGranted", "Event not emitted");
    assert.equal(addAdminTx.logs[0].args.addr, storeOwner, "User address that got admin rights not found");

    const addStorefrontTx = await marketplaceInstance.addStorefront( "Fruit shop", { from: storeOwner } );
    assert.equal(addStorefrontTx.logs[0].event, "LogNewStorefrontCreated", "Event not emitted");
    assert.equal(addStorefrontTx.logs[0].args.owner, storeOwner, "Store owner address not found");
    assert.equal(addStorefrontTx.logs[0].args.name, "Fruit shop", "Store name doesn't match");
    assert.equal(parseInt(addStorefrontTx.logs[0].args.balance), 0, "Balance doesn't match");
    assert.equal(parseInt(addStorefrontTx.logs[0].args.productCount), 0, "Product count doesn't match");
    
    const productName = "banana";
    const quantity = 2;
    const storeIndex = 0;
    const addProductToStoreFrontTx = await marketplaceInstance.addProductToStoreFront(storeIndex, productName, price, quantity, { from: storeOwner });
    assert.equal(addProductToStoreFrontTx.logs[0].event, "LogNewProductAdded", "Event not emitted");
    assert.equal(addProductToStoreFrontTx.logs[0].args.name, productName, "Product name doesn't match");
    assert.equal(parseInt(addProductToStoreFrontTx.logs[0].args.price), price, "Price doesn't match");
    assert.equal(parseInt(addProductToStoreFrontTx.logs[0].args.quantity), quantity, "Quantity doesn't match");


    const purchaseProductTx = await marketplaceInstance.purchaseProduct(storeOwner, storeIndex, 0, 1, {value: price, from: owner});
    assert.equal(purchaseProductTx.logs[0].event, "LogPurchaseProduct", "Event not emitted");
    assert.equal(parseInt(purchaseProductTx.logs[0].args.productIndex), 0, "Product index doesn't match");
    assert.equal(parseInt(purchaseProductTx.logs[0].args.storeIndex), storeIndex, "Store index doesn't match");
    assert.equal(purchaseProductTx.logs[0].args.storeOwner, storeOwner, "Store owner address doesn't match");


    const withdrawFundsTx = await marketplaceInstance.withdrawFunds(storeIndex, price, {from: storeOwner});
    assert.equal(withdrawFundsTx.logs[0].event, "LogWithdraw", "Event not emitted");
    assert.equal(parseInt(withdrawFundsTx.logs[0].args.storeIndex), storeIndex, "Store index doesn't match");
    assert.equal(withdrawFundsTx.logs[0].args.addr, storeOwner, "Store owner address doesn't match");
    
    const removeProductFromStorefrontTx = await marketplaceInstance.removeProductFromStorefront(storeOwner, storeIndex, 0, { from: storeOwner });
    assert.equal(removeProductFromStorefrontTx.logs[0].event, "LogProductRemoved", "Event not emitted");
    assert.equal(parseInt(removeProductFromStorefrontTx.logs[0].args.index), 0, "Product index doesn't match");
    assert.equal(parseInt(removeProductFromStorefrontTx.logs[0].args.storeIndex), storeIndex, "Store index doesn't match");
    assert.equal(removeProductFromStorefrontTx.logs[0].args.storeOwner, storeOwner, "Store owner address doesn't match");

    const removeStorefrontTx = await marketplaceInstance.removeStorefront(storeOwner, storeIndex, {from: storeOwner});
    assert.equal(removeStorefrontTx.logs[0].event, "LogStorefrontRemoved", "Event not emitted");
    assert.equal(parseInt(removeStorefrontTx.logs[0].args.storeIndex), storeIndex, "Store index doesn't match");
    assert.equal(removeStorefrontTx.logs[0].args.storeOwner, storeOwner, "Store owner address doesn't match");

    const deleteUserTx = await marketplaceInstance.deleteUser(storeOwner, {from: owner});
    assert.equal(deleteUserTx.logs[0].event, "LogDeleteUser", "Event not emitted");
    assert.equal(deleteUserTx.logs[0].args.addr, storeOwner, "Store owner address doesn't match");
  });

  // Helper methods for tests to get idea how we can convert and iterate data
  // in the UI side.
  var convertToStringArray = function bytesToString(bytes) {
    var singleString = convertToSingleString(bytes);
    return splitStringsToArray(singleString);
  }

  var splitStringsToArray = function singleStringToArray(singleString) {
      var params = [];
      var res = "";
      for (var i = 0; i <= singleString.length; i++) {
          if (singleString.charCodeAt(i) > 31) {
              res += singleString[i];
          }
          else 
          {
              params.push(res);
              res = "";
          }
      }
      params.pop();
      return params;
  }

  var convertToSingleString = function toSingleString(bytes) {
      var str = '';
      for (var i = 0; i < bytes.length; i += 2) {
          var value = parseInt(bytes.substr(i, 2), 16);
          if (value) {
              str += String.fromCharCode(value);
          }
      }
      return str;
  }

  var getUsersThatCanAddStorefronts = function(users) {
    var owners = [];
    for (var i = 0; i < users[1].length; i++) {
        // 1 == shop owner, 2 == admin
        if (parseInt(users[1][i]) === 1 || parseInt(users[1][i]) === 2) {
            owners.push(users[0][i]);
        }
    }
    return owners;
  }
/*
  function ipfsHashToBytes32(ipfs_hash) {
    var h = bs58.decode(ipfs_hash).toString('hex').replace(/^1220/, '');
    if (h.length != 64) {
        console.log('invalid ipfs format', ipfs_hash, h);
        return null;
    }
    return '0x' + h;
}

  function bytes32ToIPFSHash(hash_hex) {
      //console.log('bytes32ToIPFSHash starts with hash_buffer', hash_hex.replace(/^0x/, ''));
      var buf = new Buffer(hash_hex.replace(/^0x/, '1220'), 'hex')
      return bs58.encode(buf)
  }*/
});
