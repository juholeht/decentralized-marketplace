import {Translator} from './translator';

export var ContractAccess={
    
    async getAllStorefronts(contract, caller) {
        const users = await contract.methods.getUsers().call({from: caller});
        const owners = Translator.getStoreOwners(users);
        let existingStorefronts = [];

        for (var i = 0; i < owners.length; i++)
        {
          const storeFrontOwner = owners[i];
          const storefronts = await contract.methods.getStorefronts(storeFrontOwner).call({from: caller});
          if (storefronts[2].length > 0) {
            const names = Translator.convertToStringArray(storefronts[0]);
            for (var j = 0; j < storefronts[2].length; j++) 
            {
              existingStorefronts.push({owner: storeFrontOwner, name: names[j], balance: parseInt(storefronts[1][j]), productCount: parseInt(storefronts[2][j]), index: j});
            }
          }
        }
        return existingStorefronts;
    },
    async getStorefrontsForOwner(contract, storeFrontOwner, caller) {
        let existingStorefronts = [];
        const storefronts = await contract.methods.getStorefronts(storeFrontOwner).call({from: caller});
        if (storefronts[2].length > 0) {
            const names = Translator.convertToStringArray(storefronts[0]);
            for (var j = 0; j < storefronts[2].length; j++) 
            {
                existingStorefronts.push({owner: storeFrontOwner, name: names[j], balance: parseInt(storefronts[1][j]), productCount: parseInt(storefronts[2][j]), index: j});
            }
        }
        return existingStorefronts;
      }
}