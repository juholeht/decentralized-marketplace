import {createStore} from 'redux'

var initialState={
    userStatus: 'unknown',
    drawerState: false,
    page: 'storefronts',
    contract: null,
    ipfs: null,
    accounts: [],
    selectedStorefront: {name: 'not selected', addr: 'not selected', index: -1}
}

export function reducer(previousState,action) 
{
    if (!previousState) return initialState;
	if (action.type==="USER_STATUS_UPDATED")
        return Object.assign({},previousState,{userStatus:action.data});
    if (action.type==="DRAWER_STATE_UPDATED")
        return Object.assign({},previousState,{drawerState:action.data});
    if (action.type==="PAGE_UPDATED")
        return Object.assign({},previousState,{page:action.data});
    if (action.type==="CONTRACT_LOADED") {
        return Object.assign({},previousState,{contract:action.data});
    }
    if (action.type==="IPFS_LOADED") {
        return Object.assign({},previousState,{ipfs:action.data});
    }
    if (action.type==="ACCOUNTS_LOADED")
		return Object.assign({},previousState,{accounts:action.data});
    if (action.type==="STOREFRONT_SELECTED"){
        return Object.assign({},previousState,{},{selectedStorefront:action.data});
    }
	return previousState;
}

export var marketStore=createStore(reducer);

export var Actions={
	createAction( type, data ){ return { type, data } },
	fire(action){marketStore.dispatch(action)},
	
	userStatusUpdated(userStatus){return this.createAction("USER_STATUS_UPDATED", userStatus);},
    fireUserStatusUpdated(userStatus){this.fire(this.userStatusUpdated(userStatus))},
    
    drawerStateUpdated(drawerState){return this.createAction("DRAWER_STATE_UPDATED", drawerState);},
    fireDrawerStateUpdated(drawerState){this.fire(this.drawerStateUpdated(drawerState))},
    
    pageSelected(page){return this.createAction("PAGE_UPDATED", page);},
    firePageSelected(page){this.fire(this.pageSelected(page))},

    contractLoaded(contract){return this.createAction("CONTRACT_LOADED", contract);},
    fireContractLoaded(storefronts){this.fire(this.contractLoaded(storefronts))},

    ipfsLoaded(ipfs){return this.createAction("IPFS_LOADED", ipfs);},
    fireIpfsLoaded(ipfs){this.fire(this.ipfsLoaded(ipfs))},

    accountsLoaded(accounts){return this.createAction("ACCOUNTS_LOADED", accounts);},
    fireAccountsLoaded(accounts){this.fire(this.accountsLoaded(accounts))},

    storefrontSelected(storefront){return this.createAction("STOREFRONT_SELECTED", storefront);},
    fireStorefrontSelected(storefront){this.fire(this.storefrontSelected(storefront))}
}
