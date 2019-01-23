export var UsersUtil={
    
    SHOPPER_STATUS: "Shopper",
    SHOP_OWNER_STATUS: "Shop owner",
    ADMIN_STATUS: "Administrator",
    SHOPPER_WAITING_APPROVAL_STATUS: "Shopper (waiting approval)",

    isAdmin(status) {
        return status === this.ADMIN_STATUS;
    },
    isShopper(userStatus) {
        return userStatus === this.SHOPPER_STATUS || userStatus === this.SHOPPER_WAITING_APPROVAL_STATUS;
    },
    isShopOwner(userStatus) {
        return userStatus === this.SHOP_OWNER_STATUS;
    },
    isShopperWaitingApproval(userStatus) {
        return userStatus === this.SHOPPER_WAITING_APPROVAL_STATUS;
    }
}