const Blockchain = require('./blockchain'); // Adjust the path if necessary
const { v4: uuidv4 } = require('uuid');

describe('Blockchain', () => {
  let blockchain;

  beforeEach(() => {
    blockchain = new Blockchain(5); // Create a new blockchain with difficulty increment interval of 5
  });

  test('should create a blockchain with an initial block', () => {
    expect(blockchain.chain.length).toBe(1);
    expect(blockchain.chain[0].index).toBe(0);
    expect(blockchain.chain[0].prevHash).toBe('0');
  });

  test('should add a new transaction', () => {
    blockchain.createTransaction(100, 'Alice', 'Bob');
    expect(blockchain.pendingTransactions.length).toBe(1);
    expect(blockchain.pendingTransactions[0].amount).toBe(100);
    expect(blockchain.pendingTransactions[0].sender).toBe('Alice');
    expect(blockchain.pendingTransactions[0].recipient).toBe('Bob');
  });

  test('should mine a block', () => {
    blockchain.createTransaction(100, 'Alice', 'Bob');
    blockchain.mine();
    expect(blockchain.chain.length).toBe(2);
    expect(blockchain.pendingTransactions.length).toBe(0);
  });

  test('should validate the blockchain', () => {
    blockchain.createTransaction(100, 'Alice', 'Bob');
    blockchain.mine();
    expect(blockchain.chainIsValid()).toBe(true);
  });

  test('should detect an invalid blockchain', () => {
    blockchain.createTransaction(100, 'Alice', 'Bob');
    blockchain.mine();
    blockchain.chain[1].transactions[0].amount = 200; // Tamper with a transaction
    expect(blockchain.chainIsValid()).toBe(false);
  });

  test('should increase difficulty after specified number of blocks', () => {
    for (let i = 0; i < 5; i++) {
      blockchain.createTransaction(100, 'Alice', 'Bob');
      blockchain.mine();
    }
    expect(blockchain.difficulty).toBe(4);
  });

  test('should compute the average hash rate', () => {
    blockchain.createTransaction(100, 'Alice', 'Bob');
    blockchain.mine();
    expect(blockchain.totalHashes).toBeGreaterThan(0);
    expect(blockchain.totalTime).toBeGreaterThan(0);
    expect((blockchain.totalHashes / blockchain.totalTime).toFixed(2)).toMatch(
      /^\d+\.\d{2}$/
    );
  });
});

function simulateChain(blockchain, numTxs, numBlocks) {
  for (let i = 0; i < numBlocks; i++) {
    let numTxsRand = Math.floor(Math.random() * Math.floor(numTxs));
    for (let j = 0; j < numTxsRand; j++) {
      let sender = uuidv4().substr(0, 5);
      let receiver = uuidv4().substr(0, 5);
      blockchain.createTransaction(
        Math.floor(Math.random() * Math.floor(1000)),
        sender,
        receiver
      );
    }
    blockchain.mine();
  }
}

// Create a blockchain with a difficulty increment interval of 5 blocks
const BChain = new Blockchain(5);
simulateChain(BChain, 7, 3); // Run simulation with smaller number of blocks for testing

module.exports = Blockchain;
