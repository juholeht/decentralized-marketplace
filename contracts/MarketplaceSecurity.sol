pragma solidity 0.5.0;

import "./StringUtil.sol";


/** @title Marketplace security. 
  * @author Juho Lehtonen
*/
contract MarketplaceSecurity {

    address internal owner;
    bool internal reentryProtector = false;
    bool internal isContractActive = true;
    uint internal withdrawalSuspendedUntilTime = 0;
    uint internal constant MAX_STRING_LENGTH = 25;
    uint internal constant IPFS_HASH_STRING_LENGTH = 46;

    modifier externalFunctionCallIsNotOngoing() {
        require(!reentryProtector, "External call is ongoing. Function call denied.");
        _;
    }

    modifier isOwner() {
        require(msg.sender == owner, "Caller is not contract owner");
        _;
    }

    modifier isContractActivated {
        require(isContractActive, "Contract is deactive. Function call denied.");
        _;
    }

    modifier isContractDeactivated {
        require(!isContractActive, "Contract is actived. Function call denied.");
        _;
    }

    modifier isWithdrawalAllowed() {
        require(now >= withdrawalSuspendedUntilTime, "Withdrawals are suspended temporarily");
        _;        
    }

    modifier isValidString(string memory str) {
        require(stringValidation(str), 
            "Invalid string. Valid charactes a-z, A-Z, 0-9, dot and space. Max length is 25");
        _;        
    }

    modifier isValidIpfsHashString(string memory str) {
        require(ipfsHashValidation(str), 
            "Invalid string. Valid charactes a-z, A-Z, 0-9, dot and space. Max length is 46. Starting with 'Qm'");
        _;        
    }

    /** @notice Erase ownership information.
      * @dev Once ownership is erased, contract can't be destroyed nor
      * deactivated by contract creator.
      */
    function disown()
    public
    isOwner()
    {
        delete owner;
    }

    /** @notice Destroy the contract and remove it from the blockchain. 
      * @dev Only contract owner can destroy contract. Contract owner will 
      * receive all of the funds that the contract currently holds.
      */
    function suspendWithdrawals(uint time)
    public
    isOwner()
    {
        withdrawalSuspendedUntilTime = now + time;
    }

    /** @notice Destroy the contract and remove it from the blockchain. 
      * @dev Only contract owner can destroy contract. Contract owner will 
      * receive all of the funds that the contract currently holds.
      */
    function kill()
    public
    isOwner()
    {
        selfdestruct(address(uint160(owner)));
    }

    /** @notice Toggle contract's activity state. 
      * @dev If contract is active when function is called, contract will be deactivated. If contract is deactivated 
      * when function is called, contract will be activated. A circuit breaker can be triggered manually by contract 
      * owner. Function is used when a bug is discovered.
      */
    function toggleContractActive() 
    public
    isOwner()
    {
        isContractActive = !isContractActive;
    }

    /** @notice Mark contract as having entered an external function.
      * @dev Throws an exception if called twice with no externalLeave().
      * NOTE: 
      * - call externalEnter() at the start of each external function
      * - call externalLeave() at the end of each external function
      * - never use return statements in between enter and leave
      * - never call an external function from another function
      */
    function externalEnter()
    internal
    externalFunctionCallIsNotOngoing()
    {
        reentryProtector = true;
    }

    /** @notice Mark contract as having left an external function.
      * @dev Do this after each call to externalEnter().
      */
    function externalLeave() 
    internal 
    {
        reentryProtector = false;
    }

    /** @notice Check validity of string.
      * @dev Limiting the length of user-supplied string.
      * @return isValid Result of validation.
      */
    function stringValidation(string memory str)
    private
    pure
    returns (bool isValid)
    {
        bytes memory b = bytes(str);
        if (b.length > MAX_STRING_LENGTH) {
            return false;
        }

        for (uint i; i < b.length; i++) {
            bytes1 char = b[i];
            if (!(char >= 0x30 && char <= 0x39) && // 9-0
                !(char >= 0x41 && char <= 0x5A) && // A-Z
                !(char >= 0x61 && char <= 0x7A) && // a-z
                !(char == 0x2E) && // .
                !(char == 0x20) // space
            ) {
                return false;
            }
        }
        return true;
    }

    /** @notice Check validity of IPFS hash.
      * @dev Chech that IPFS hash begins with "Qm" and
      * the length is 46.
      * @return isValid Result of validation.
      */
    function ipfsHashValidation(string memory ipfsHash)
    private
    pure
    returns (bool isValid)
    {
        bytes memory b = bytes(ipfsHash);
        if (b.length != IPFS_HASH_STRING_LENGTH) {
            return false;
        }

        // starting with "Qm"
        if (b[0] != 0x51 || b[1] != 0x6D) {
            return false;
        }

        for (uint i; i < b.length; i++) {
            bytes1 char = b[i];
            if (!(char >= 0x30 && char <= 0x39) && // 9-0
                !(char >= 0x41 && char <= 0x5A) && // A-Z
                !(char >= 0x61 && char <= 0x7A) // a-z
            ) {
                return false;
            }
        }
        return true;
    }
}