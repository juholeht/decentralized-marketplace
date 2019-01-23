import bs58 from "bs58";

const EMPTY_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

export var IpfsUtil={

    ipfsHashToBytes32(ipfsHash) {
        var h = bs58.decode(ipfsHash).toString('hex').replace(/^1220/, '');
        if (h.length !== 64) {
            console.log('[ERROR]: invalid IPFS hash format: ', ipfsHash, h);
            return null;
        }
        return '0x' + h;
    },
    bytes32ToIPFSHash(hashHex) {
        if (EMPTY_HASH === hashHex) {
            return "";
        }
        var buf = new Buffer(hashHex.replace(/^0x/, '1220'), 'hex')
        return bs58.encode(buf)
    }
    
}