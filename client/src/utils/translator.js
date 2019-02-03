import {UsersUtil} from './users';
import {IpfsUtil} from './ipfs';


export var Translator={

    convertUserStatusCode(userStatus) {
        if (userStatus === 0) {
          return UsersUtil.SHOPPER_STATUS;
        } else if (userStatus === 1) {
          return UsersUtil.SHOP_OWNER_STATUS;
        } else if (userStatus === 2) {
          return UsersUtil.ADMIN_STATUS;
        } else if (userStatus === 3) {
            return UsersUtil.SHOPPER_WAITING_APPROVAL_STATUS;
        }
        return "Unknown";
      },
    convertUserData(usersRaw) {
        let reformattedUsers = [];
        if (usersRaw) {
            for (var i = 0; i < usersRaw[0].length; i++) {
                reformattedUsers.push({addr: usersRaw[0][i], status: this.convertUserStatusCode(parseInt(usersRaw[1][i]))});
            }
        }
        return reformattedUsers;
    },
    convertStorefrontsData(storeFrontOwner, storefronts, existingStorefronts) {
        existingStorefronts = existingStorefronts ? existingStorefronts : [];

        if (storefronts[2].length > 0) {
        const names = this.convertToStringArray(storefronts[0]);
        for (var j = 0; j < storefronts[2].length; j++) 
        {
            existingStorefronts.push({
                owner: storeFrontOwner, 
                name: names[j], 
                balance: parseInt(storefronts[1][j]), 
                productCount: parseInt(storefronts[2][j]), 
                index: j
            });
        }
        }
        return existingStorefronts;
    },
    convertProductsData(productsRaw) {
        const productNames = this.convertToStringArray(productsRaw[0]);

        let existingProducts = [];
    
        for (var i = 0; i < productNames.length; i++) {
          existingProducts.push({
              name: productNames[i], 
              price: parseInt(productsRaw[1][i]), 
              quantity: parseInt(productsRaw[2][i]), 
              index: i,
              ipfsHash: IpfsUtil.bytes32ToIPFSHash(productsRaw[3][i])});
        }
        return existingProducts;
    },
    convertToStringArray(bytes) {
        var singleString = this.convertToSingleString(bytes);
        return this.splitStringsToArray(singleString);
    },
    splitStringsToArray(singleString) {
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
      },
      convertToSingleString(bytes) {
          var str = '';
          if (bytes) {
            for (var i = 0; i < bytes.length; i += 2) {
                var value = parseInt(bytes.substr(i, 2), 16);
                if (value) {
                    str += String.fromCharCode(value);
                }
            }
          }
          return str;
      },
      getStoreOwners(users) {
        var owners = [];
        if (users) {
            for (var i = 0; i < users[1].length; i++) {
                // 1 == shop owner, 2 == admin
                if (parseInt(users[1][i]) === 1 || parseInt(users[1][i]) === 2) {
                    owners.push(users[0][i]);
                }
            }
        }
        return owners;
      }
}