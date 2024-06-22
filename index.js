import dotenv from "dotenv";
import {Web3} from "web3";
import { erc721Abi, faucetAbi, aaveAbi, erc6551RegistryAbi, erc6551AccountImplementationAbi, wBtcFaucetAbi } from "./abis/abis.js"

dotenv.config();

const config = {
    faucetContractAddress: "0xC959483DBa39aa9E78757139af0e9a2EDEb3f42D",
    wBtcFaucetAddress: "0x29f2D40B0605204364af54EC677bD022dA425d03",
    aaveContractAddress: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
    erc6551Registry: "0x2F6B710AF9Aa868b1a8896Dcf13965e16d247eCf",
    erc6551AccountImplementation: "0x1930EeF168FD8C6C676328986E911650127ff0d6",
    erc721: "0x75906c81E0CF28121FAcFb4611cDcD2Ac2482AcE",
    erc20: "0xf20DC6A288818559D38378224210A608B6d04317"
};

async function main() {
    const web3 = new Web3(process.env.RPC_URL);
    // Use the wallet's private key directly
    const privateKey = Buffer.from(process.env.WALLET_PRIVATE_KEY, 'hex');
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    
    // Initialize the pre-deployed NFT contract
    const mockErc721Contract = new web3.eth.Contract(erc721Abi, config.erc721);

    const mockErc20Contract = new web3.eth.Contract(erc721Abi, config.erc20);

    const faucetContract = new web3.eth.Contract(faucetAbi, config.faucetContractAddress);

    const aaveContract = new web3.eth.Contract(aaveAbi, config.aaveContractAddress);

    // Mint NFT for TBA
    let mintNftTx = await mockErc721Contract.methods.safeMint(account.address).send({ from: account.address });
    let tokenId = mintNftTx.events.Transfer.returnValues.tokenId;
    console.log(`Minted NFT with token ID: ${tokenId}`);
    console.log(`Minted NFT with transaction hash: ${mintNftTx.transactionHash}`);

    // Initialise wBTC
    const wBtcFaucetContract = new web3.eth.Contract(wBtcFaucetAbi, config.wBtcFaucetAddress);
    // Initialise registry contract
    const erc6551RegistryContract = new web3.eth.Contract(erc6551RegistryAbi, config.erc6551Registry);

    // // Create TBA Account
    const createAccountTx = await erc6551RegistryContract.methods.createAccount(config.erc6551AccountImplementation, 11155111, config.erc721, tokenId, 0,[]).send({ from: account.address });
    console.log(`TBA account created with transaction hash: ${createAccountTx.transactionHash}`);

    // Get TBA address
    const tbaAccountAddres = await erc6551RegistryContract.methods.account(config.erc6551AccountImplementation, 11155111, config.erc721, tokenId, 0).call();
    console.log(`TBA account address: ${tbaAccountAddres}`);

    // Initialize TBA contract 
    const tbaContract = new web3.eth.Contract(erc6551AccountImplementationAbi, tbaAccountAddres);

    // Mint NFT and transfer to TBA
    mintNftTx = await mockErc721Contract.methods.safeMint(account.address).send({ from: account.address });
    tokenId = mintNftTx.events.Transfer.returnValues.tokenId;
    console.log(`Minted NFT with token ID: ${tokenId}`);
    console.log(`Minted NFT with transaction hash: ${mintNftTx.transactionHash}`);

    const transferNFTtoTbaTxn = await mockErc721Contract.methods.transferFrom(account.address, tbaAccountAddres, tokenId).send({ from: account.address });

    console.log(`NFT transferred to TBA with token ID: ${tokenId}`);
    console.log(`NFT transferred to TBA with transaction hash: ${transferNFTtoTbaTxn.transactionHash}`);

    // // Get NFT back from TBA
    const params = [
        tbaAccountAddres, // Token owner address
        account.address, // Recipient address
        tokenId // ID of the NFT to transfer
    ];

    const encodedTxn = mockErc721Contract.methods.transferFrom(...params).encodeABI();

    const transferNFTtoAccountTxn = await tbaContract.methods.executeCall(config.erc721, 0, encodedTxn).send({ from: account.address });

    console.log(`NFT transferred to user Account with token ID: ${tokenId}`);
    console.log(`NFT transferred to user Account with transaction hash: ${transferNFTtoAccountTxn.transactionHash}`);

    // Load TBA with wBTC faucet to supply in aave pool
    const mintFaucetTx = await faucetContract.methods.mint(config.wBtcFaucetAddress, tbaAccountAddres, 100000000).send({ from: account.address });
    console.log(`Minted wBtcFaucet with transaction hash: ${mintFaucetTx.transactionHash}`);

    // Set allowance
    const allowanceParams = [config.aaveContractAddress, 99999999999999999999]
    const allowanceEncodedTxn = wBtcFaucetContract.methods.approve(...allowanceParams).encodeABI();
    const allowanceTxn = await tbaContract.methods.executeCall(config.wBtcFaucetAddress, 0, allowanceEncodedTxn).send({ from: account.address });
    console.log(`ALlowance txn hash: ${allowanceTxn.transactionHash}`);

    // Send wBTC from TBA account to aave pool
    const supplyParams = [config.wBtcFaucetAddress,100000000,tbaAccountAddres,0]
    const supplyEncodedTxn = aaveContract.methods.supply(...supplyParams).encodeABI();
    const supplyPoolTxn = await tbaContract.methods.executeCall(config.aaveContractAddress, 0, supplyEncodedTxn).send({ from: account.address });
    console.log(`supplyTx with transaction hash: ${supplyPoolTxn.transactionHash}`);

    // Borrow wBTC from aave
    const borrowParams = [config.wBtcFaucetAddress,50000000,2,0,tbaAccountAddres]
    const borrowEncodedTx = aaveContract.methods.borrow(...borrowParams).encodeABI();
    const borrowTxn = await tbaContract.methods.executeCall(config.aaveContractAddress, 0, borrowEncodedTx).send({from:account.address})
    console.log(`borrowTx with transaction hash: ${borrowTxn.transactionHash}`);

    // withdraw from pool
    const withdrawParams = [config.wBtcFaucetAddress,100000000,account.address]
    const withdrawEncodedTxn = aaveContract.methods.withdraw(...withdrawParams).encodeABI();
    const withdrawTxn = await tbaContract.methods.executeCall(config.aaveContractAddress, 0, withdrawEncodedTxn).send({from: account.address})
    console.log(`withdrawTxn with transaction hash: ${withdrawTxn.transactionHash}`);

}
main()