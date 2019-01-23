pragma solidity 0.5.0;

import "truffle/Assert.sol";
import "../contracts/MarketplaceSecurity.sol";


contract DummyMarketplace is MarketplaceSecurity {
    
    uint public testVariable = 100;

    constructor() 
    public 
    {
        owner = msg.sender;
    }

    function testStringValidation(string memory name) 
    public
    pure
    isValidString(name)
    {}

    function testIpfsHashStringValidation(string memory ipfsHashString) 
    public
    pure
    isValidIpfsHashString(ipfsHashString)
    {}

    function testFunctionAllowedWhenContractActive() 
    public
    view
    isContractActivated()
    {}

    function testFunctionAllowedWhenContractDeactive() 
    public
    view
    isContractDeactivated()
    {}

    function testFunctionExternalCallOngoing() 
    public
    view
    externalFunctionCallIsNotOngoing()
    {}

    // wrapper for internal function
    function wrapExternalEnter()
    public
    {
        externalEnter();
    }

    // wrapper for internal function
    function wrapExternalLeave() 
    public 
    {
        externalLeave();
    }

    function testWithdraw()
    public
    view
    isWithdrawalAllowed()
    {}
}


contract TestMarketplaceSecurity {

    // test for valid string
    function testValidString() 
    public 
    {
        DummyMarketplace marketplace = new DummyMarketplace();
        marketplace.testStringValidation("Valid String IS THIS ...");
    }

    // test if the string is too long
    function testTooLongString() 
    public 
    {
        DummyMarketplace marketplace = new DummyMarketplace();
        (bool success,) = address(marketplace)
            .call(abi.encodeWithSignature("testStringValidation(string)", "123456789012345678901234567890"));
        Assert.isFalse(success, "Should fail because name is too long");
    }

    // test if the string contains characters that are not allowed
    function testIpfsHashContainsCharactersThatAreNotAllowed() 
    public 
    {
        DummyMarketplace marketplace = new DummyMarketplace();
        (bool success,) = address(marketplace)
            .call(abi.encodeWithSignature("testIpfsHashStringValidation(string)", "1-¨<>"));
        Assert.isFalse(success, "Should fail because IPFS hash string contains characters that are not allowed");
    }

    // test for valid string
    function testValidIpfsHash() 
    public 
    {
        DummyMarketplace marketplace = new DummyMarketplace();
        marketplace.testIpfsHashStringValidation("QmbiFR8ydGCn9jgScvDHhtMxDoh5DuTDeL57BCsqyUd2TA");
    }

    // test if the IPFS hash string is too long
    function testTooLongIPFSHashString() 
    public 
    {
        DummyMarketplace marketplace = new DummyMarketplace();
        (bool success,) = address(marketplace)
            .call(abi.encodeWithSignature("testIpfsHashStringValidation(string)", "12345678901234567890123456789012345678901234567890"));
        Assert.isFalse(success, "Should fail because IPFS hash is too long");
    }

    // test if IPFS hash doesn't begin with "Qm"
    function testIPFSHashStringStartWithQmPrefix() 
    public 
    {
        DummyMarketplace marketplace = new DummyMarketplace();
        (bool success,) = address(marketplace)
            .call(abi.encodeWithSignature("testIpfsHashStringValidation(string)", "QnbiFR8ydGCn9jgScvDHhtMxDoh5DuTDeL57BCsqyUd2TA"));
        Assert.isFalse(success, "Should fail because IPFS hash contain valid prefix");
    }

    // test if the string contains characters that are not allowed
    function testStringContainsCharactersThatAreNotAllowed() 
    public 
    {
        DummyMarketplace marketplace = new DummyMarketplace();
        (bool success,) = address(marketplace)
            .call(abi.encodeWithSignature("testStringValidation(string)", "1-¨<>"));
        Assert.isFalse(success, "Should fail because string contains characters that are not allowed");
    }

    // test call should fail when contract is deactive
    function testFunctionAllowedWhenContractActive_CallShouldFailWhenContractIsDeactive() 
    public 
    {
        DummyMarketplace marketplace = new DummyMarketplace();
        marketplace.toggleContractActive();
        (bool success,) = address(marketplace)
            .call(abi.encodeWithSignature("testFunctionAllowedWhenContractActive()"));
        Assert.isFalse(success, "Should fail when contract deactive");
    }

    // test call should be successful when contract is active
    function testFunctionAllowedWhenContractActive_CallShouldBeSuccessfulWhenContractIsActive() 
    public 
    {
        DummyMarketplace marketplace = new DummyMarketplace();
        (bool success,) = address(marketplace)
            .call(abi.encodeWithSignature("testFunctionAllowedWhenContractActive()"));
        Assert.isTrue(success, "Should pass when contract active");
    }

    // test call should fail when contract is active
    function testFunctionAllowedWhenContractDeactive_CallShouldFailWhenContractIsActive() 
    public 
    {
        DummyMarketplace marketplace = new DummyMarketplace();
        (bool success,) = address(marketplace)
            .call(abi.encodeWithSignature("testFunctionAllowedWhenContractDeactive()"));
        Assert.isFalse(success, "Should fail when contract active");
    }

    // test call should be successful when contract is deactive
    function testFunctionAllowedWhenContractDeactive_CallShouldBeSuccessfulWhenContractIsDeactive() 
    public 
    {
        DummyMarketplace marketplace = new DummyMarketplace();
        marketplace.toggleContractActive();
        (bool success,) = address(marketplace)
            .call(abi.encodeWithSignature("testFunctionAllowedWhenContractDeactive()"));
        Assert.isTrue(success, "Should pass when contract deactive");
    }

    // test function call should not be possible when external call is already ongoing
    function testReentryProtectionCallShouldFailIfExternalCallIsOngoing() 
    public 
    {
        DummyMarketplace marketplace = new DummyMarketplace();
        marketplace.wrapExternalEnter();
        (bool success,) = address(marketplace)
            .call(abi.encodeWithSignature("testFunctionExternalCallOngoing()"));
        Assert.isFalse(success, "Should fail when external call is ongoing");
    }

    // test function call should be possible when external call has ended
    function testReentryProtectionCallShouldPassIfExternalCallHasEnded() 
    public 
    {
        DummyMarketplace marketplace = new DummyMarketplace();
        marketplace.wrapExternalEnter();
        marketplace.wrapExternalLeave();
        (bool success,) = address(marketplace)
            .call(abi.encodeWithSignature("testFunctionExternalCallOngoing()"));
        Assert.isTrue(success, "Should pass when external call has ended");
    }

    // test should fail if ownership of contract is removed.
    function testOwnerShouldNotBeAbleToDeactivateContractIfOwnershipRemoved() 
    public 
    {
        DummyMarketplace marketplace = new DummyMarketplace();
        marketplace.disown();
        (bool success,) = address(marketplace)
            .call(abi.encodeWithSignature("toggleContractActive()"));
        Assert.isFalse(success, "Should fail because ownership is removed");
    }

    // test withdraw should fail when withdraws are suspended
    function testWithdrawShouldFailWhenSuspended() 
    public 
    {
        DummyMarketplace marketplace = new DummyMarketplace();
        marketplace.suspendWithdrawals(10000);
        (bool success,) = address(marketplace)
            .call(abi.encodeWithSignature("testWithdraw()"));
        Assert.isFalse(success, "Should fail because withdraws are suspended");
    }

    // test contract is destroyed when kill is called. All the variables
    // are set 0 when selfdestruct is called.
    function testContractIsDestroyedWhenKillIsCalled() 
    public 
    {
        DummyMarketplace marketplace = new DummyMarketplace();
        marketplace.kill();
        bool isDead = false;
        if (DummyMarketplace(marketplace).testVariable() == 0) {
            isDead = true;
        }
        Assert.isFalse(isDead, "Contract should be destroyed");
    }
}