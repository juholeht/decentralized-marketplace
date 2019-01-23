Fail early and fail loud
-> Parameters that are passed for functions are checked with modifiers. Functions' modifiers 
checks the condition required for execution as early as possible in the function body and throws 
an exception if the condition is not met.

Restricting Access
-> Access to contract state variables and functions are restricted. Only functions that are supposed
to be called from outside are exposed.

Auto Deprecation
-> I decided not to implement this pattern. I decided to implement kill switch instead so contract 
can be destroyed by contract owner.

Mortal
-> Contract has ability to destroy itself. Only contract owner can call this function.
Contract owner will receive all of the funds that the contract currently holds

Pull over Push Payments (withdrawal pattern)
-> Only user can withdraw to own address. Only exception is emergency withdraw function which can 
be used only by contract owner. Balance states in contract are updated before calling transfer to prevent 
re-entrancy attacks.

Circuit Breaker
-> In case of emergency, contract owner can deactivate contract. When contract is deactivated, 
every function that could change contract state will become unavailable. Only emergency withdraw 
function will be available when contract is deactivated. Emergency withdraw will transfer funds
for store owners.

State Machine
-> Marketplace contract works as an state machine. E.g. when user comes first time to marketplace,
person is consider as "Shopper". Shopper can request rights to become "Shop owner" so that user could add
storefronts and products to marketplace. After request has been made "Admin" can grant shop owner rights
for the user. Finally user is considered as "Shop owner" and is allowed to use "Shop owner" functionalities.

Speed Bump
-> Withdrawals can be suspended by contract owner.