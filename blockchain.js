const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Block represents a block in the blockchain. It has the
 * following params:
 * @index represents its position in the blockchain
 * @timestamp shows when it was created
 * @transactions represents the data about transactions
 * added to the chain
 * @hash represents the hash of the previous block
 */
class Block {
    constructor(index, transactions, prevHash, nonce, hash, timestamp) {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.prevHash = prevHash;
        this.hash = hash;
        this.nonce = nonce;
    }
}

/**
 * A blockchain transaction. Has an amount, sender and a
 * recipient (not UTXO).
 */
class Transaction {
    constructor(amount, sender, recipient) {
        this.amount = amount;
        this.sender = sender;
        this.recipient = recipient;
        this.tx_id = uuidv4().split('-').join('');
    }
}

/**
 * Blockchain represents the entire blockchain with the
 * ability to create transactions, mine and validate
 * all blocks.
 */
class Blockchain {
    constructor(difficultyIncrementInterval) {
        this.chain = [];
        this.pendingTransactions = [];
        this.difficulty = 3; // Initial difficulty
        this.difficultyIncrementInterval = difficultyIncrementInterval;
        this.totalHashes = 0;
        this.totalTime = 0;
        this.addBlock('0');
    }

    /**
     * Creates a transaction on the blockchain
     */
    createTransaction(amount, sender, recipient) {
        this.pendingTransactions.push(new Transaction(amount, sender, recipient));
    }

    /**
     * Add a block to the blockchain
     */
    addBlock(nonce, timestamp) {
        let index = this.chain.length;
        let prevHash = this.chain.length !== 0 ? this.chain[this.chain.length - 1].hash : '0';
        let hash = this.getHash(prevHash, this.pendingTransactions, nonce, timestamp);
        let block = new Block(index, this.pendingTransactions, prevHash, nonce, hash, timestamp);

        // Reset pending txs
        this.pendingTransactions = [];
        this.chain.push(block);

        // Increase difficulty if the block index is a multiple of the difficulty increment interval
        if (index > 0 && index % this.difficultyIncrementInterval === 0) {
            this.difficulty++;
            console.log(`Difficulty increased to: ${this.difficulty}`);
        }
    }

    /**
     * Gets the hash of a block.
     */
    getHash(prevHash, txs, nonce, timestamp) {
        let encrypt = prevHash + nonce + timestamp;
        txs.forEach((tx) => { 
            encrypt += tx.tx_id + tx.amount + tx.sender + tx.recipient; 
        });
        let hash = crypto.createHmac('sha256', "secret")
            .update(encrypt)
            .digest('hex');
        return hash;
    }

    /**
     * Find nonce that satisfies our proof of work.
     */
    proofOfWork() {
        let nonce = 0;
        let hash = '';
        let prevHash = this.chain.length !== 0 ? this.chain[this.chain.length - 1].hash : '0';
        let timestamp = Math.floor(Date.now() / 1000);

        let start = Date.now();
        while (!hash.startsWith('0'.repeat(this.difficulty))) {
            nonce++;
            hash = this.getHash(prevHash, this.pendingTransactions, nonce, timestamp);
        }
        let end = Date.now();

        let timeTaken = (end - start) / 1000; // Time taken in seconds
        this.totalHashes += nonce;
        this.totalTime += timeTaken;

        console.log(`Block mined with nonce: ${nonce}, hash: ${hash}, time taken: ${timeTaken} seconds`);
        return { nonce, timestamp };
    }

    /**
     * Mine a block and add it to the chain.
     */
    mine() {
        const { nonce, timestamp } = this.proofOfWork();
        this.addBlock(nonce, timestamp);

        // Output the average hash rate
        console.log(`Average hash rate: ${(this.totalHashes / this.totalTime).toFixed(2)} hashes per second`);
    }

    /**
     * Check if the chain is valid by going through all blocks and comparing their stored
     * hash with the computed hash.
     */
    chainIsValid() {
        for (let i = 0; i < this.chain.length; i++) {
            let block = this.chain[i];
            let validHash = (i === 0)
                ? this.getHash('0', [], block.nonce, block.timestamp) // Genesis block validation
                : this.getHash(this.chain[i - 1].hash, block.transactions, block.nonce, block.timestamp); // Subsequent blocks

            if (block.hash !== validHash) {
                console.log(`Invalid hash at block ${i}: ${block.hash} !== ${validHash}`);
                return false;
            }
            if (i > 0 && block.prevHash !== this.chain[i - 1].hash) {
                console.log(`Invalid previous hash at block ${i}: ${block.prevHash} !== ${this.chain[i - 1].hash}`);
                return false;
            }
        }
        return true;
    }
}

function simulateChain(blockchain, numTxs, numBlocks) {
    for (let i = 0; i < numBlocks; i++) {
        let numTxsRand = Math.floor(Math.random() * Math.floor(numTxs));
        for (let j = 0; j < numTxsRand; j++) {
            let sender = uuidv4().substr(0, 5);
            let receiver = uuidv4().substr(0, 5);
            blockchain.createTransaction(Math.floor(Math.random() * Math.floor(1000)), sender, receiver);
        }
        blockchain.mine();
    }
}

// Create a blockchain with a difficulty increment interval of 5 blocks
const BChain = new Blockchain(5);
simulateChain(BChain, 30, 15);

module.exports = Blockchain;

// Uncomment these to run a simulation
console.dir(BChain, { depth: null });
console.log('******** Validity of this blockchain: ', BChain.chainIsValid());
