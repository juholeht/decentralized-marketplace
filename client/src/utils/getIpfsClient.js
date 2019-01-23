import ipfsClient from "ipfs-http-client";

const getIpfs = () =>
  new Promise((resolve, reject) => {
    console.log(ipfsClient);
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    window.addEventListener("load", async () => {
        var ipfs = ipfsClient('localhost', '5001', { protocol: 'http' })
        console.log(ipfs);
        resolve(ipfs);
    });
  });
 
export default getIpfs;