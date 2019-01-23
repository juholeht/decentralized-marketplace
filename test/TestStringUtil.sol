pragma solidity 0.5.0;

import "truffle/Assert.sol";
import "../contracts/StringUtil.sol";


contract TestStringUtil {
    
    using StringUtil for string;
    string[] private testStringArray;

    // Test small string allocation. Make sure that there is always enough allocated.
    function testSmallStringSizeAllocation() 
    public 
    {
        string memory testString = "one";
        uint size = bytes(testString).length;
        Assert.equal(size, 3, "Test string size should be three (3)");
        Assert.equal(StringUtil.getSize(testString), 64, "Test string allocation size should be 64");
    }

    // Test bigger string allocation. Make sure that size will be increased.
    function testBigStringSizeAllocation() 
    public 
    {
        string memory testString = "onetwothreefourfivesixseveneightnineteneleventwelvethirteenfourteen";
        uint size = bytes(testString).length;
        Assert.equal(size, 67, "Test string size should be sixtyseven (67)");
        Assert.equal(StringUtil.getSize(testString), 128, "Test string size should be 128");
    }

    // Test logic with empty array. Should return empty string.
    function testConvertEmptyArrayInBytes() 
    public 
    {
        testStringArray = new string[](0);
        bytes memory emptyStringArrayInBytes = convertStringArrayToBytes();
        string memory arraString = string(emptyStringArrayInBytes);
        Assert.equal(arraString, "", "Test array should be empty");
    }

    // Test if array contains only one entry. Entry should be found from the
    // beginning of converted string.
    function testConvertArrayContainingOneStringInBytes() 
    public 
    {
        testStringArray = ["one"];
        string memory arraString = string(convertStringArrayToBytes());
        string memory firstString = substring(arraString, 0, 3);
        string memory expected = "one";
        Assert.equal(firstString, expected, "Test array should contain only string 'one'");
    }

    // Test if array contains multiple entry. Entry should be found from the
    // beginning of every 64 slot.
    function testConvertArrayContainingMultipleStringsInBytes() 
    public 
    {
        testStringArray = ["one", "two", "three"];
        string memory arraString = string(convertStringArrayToBytes());
        string memory firstString = substring(arraString, 0, 3);
        string memory secondString = substring(arraString, 64, 67);
        string memory thirdString = substring(arraString, 128, 133);
        
        Assert.equal(firstString, "one", "Test array should contain only string 'one'");
        Assert.equal(secondString, "two", "Test array should contain only string 'two'");
        Assert.equal(thirdString, "three", "Test array should contain only string 'three'");
    }

    /** @dev Get substring of given string. This is test helper method.
      * @return substr Substring of the given string
      */
    function substring(string memory str, uint startIndex, uint endIndex) 
    private 
    pure
    returns (string memory substr) 
    {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex-startIndex);
        for (uint i = startIndex; i < endIndex; i++) {
            result[i-startIndex] = strBytes[i];
        }
        return string(result);
    }

    /** @dev Get string array in bytes. Iterate through array items and 
      * transfer strings into bytes. This is test helper method.
      * @return serialized Names array in bytes.
      */
    function convertStringArrayToBytes() 
    private 
    view 
    returns(bytes memory serialized)
    {
        uint offset = 64*testStringArray.length;
        
        bytes memory buffer = new bytes(offset);
        string memory str = new string(32);

        for (uint i = testStringArray.length - 1; i < testStringArray.length; i--) {
            str = testStringArray[i];
            
            StringUtil.stringToBytes(offset, bytes(str), buffer);
            offset -= str.getSize();
        }
        return (buffer);
    }
}