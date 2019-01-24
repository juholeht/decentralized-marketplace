# decentralized-marketplace
Final project for Consensys Academy Developer Bootcamp 2019.

Main focus of the project is in Smart contract implementation. UI is there just to show how to integrate it with smart contracts.

## Introduction:

Online Marketplace

Description: Create an online marketplace that operates on the blockchain.
 
There are a list of stores on a central marketplace where shoppers can purchase goods posted by the store owners.
 
The central marketplace is managed by a group of administrators. Admins allow store owners to add stores to the marketplace. Store owners can manage their store’s inventory and funds. Shoppers can visit stores and purchase goods that are in stock using cryptocurrency.
 
User Stories:
An administrator opens the web app. The web app reads the address and identifies that the user is an admin, showing them admin only functions, such as managing store owners. An admin can grant shop owner rights for shoppers that has requested shop owner rights. Once shop owner logs into the app, they have access to the store owner functions.
 
An approved store owner logs into the app. The web app recognizes their address and identifies them as a store owner. They are shown the store owner functions. They can create a new storefront that will be displayed on the marketplace. They can also see the storefronts that they have already created. They can click on a storefront to manage it. They can add/remove products to the storefront or change any of the products’ prices. They can also withdraw any funds that the store has collected from sales.
 
A shopper logs into the app. The web app does not recognize their address so they are shown the generic shopper application. From the main page they can browse all of the storefronts that have been created in the marketplace. Clicking on a storefront will take them to a product page. They can see a list of products offered by the store, including their price and quantity. Shoppers can purchase a product, which will debit their account and send it to the store. The quantity of the item in the store’s inventory will be reduced by the appropriate amount.
 
## How to set up project:

1. First install dependencies by executing: `cd marketplace/client && npm install`
1. Start ganache-cli by executing: `ganache-cli -l 350000000`
1. (Optional) Make sure that project compiles by executing: `truffle compile`
1. (Optional) Make sure that project tests are executed successfully: `truffle test`
1. Migrate contract to development environment by executing: `truffle migrate`
1. Start local server that serves UI by executing: `npm run start` 
1. UI is now available in http://localhost:3000 (remember to use Metamask or other dapp browser)

Project uses local IPFS node to store product images. Don't worry, you can use project also without IPFS node. In this case
product image upload feature will be disabled from UI.

## How to set up IPFS node:
1. Install IPFS, e.g. https://github.com/ipfs/go-ipfs#install
1. Next you should initialize it, cmd: `ipfs init`
1. Project assumes that node configuration is default, cmd to check: `ipfs config Addresses.API` (Response should something like: /ip4/127.0.0.1/tcp/5001)
1. Enable CORS by executing cmds: `ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'` & `ipfs config --json Gateway.HTTPHeaders.Access-Control-Allow-Origin '["*"]'`
1. Finally you ready to start IPFS daemon, cmd: ipfs daemon