# FlareFlip: Decentralized Prediction Game on Flare Network

## Overview

FlareFlip is an innovative decentralized prediction game built on the Flare Network. This project leverages Flare's unique Oracle infrastructure (FTSO) and Random Number Generator to create a fair, transparent, and engaging "Heads or Tails" game with a staking mechanism and prize pools.

Unlike traditional prediction games, FlareFlip implements a "minority wins" mechanism that rewards strategic thinking rather than following the crowd, creating a more balanced and unpredictable gameplay experience.

## Table of Contents

- [Features](#features)
- [Technical Implementation](#technical-implementation)
  - [Smart Contract Architecture](#smart-contract-architecture)
  - [Flare Network Integration](#flare-network-integration)
  - [Game Mechanics](#game-mechanics)
  - [Staking Mechanism](#staking-mechanism)
- [How to Play](#how-to-play)
- [Installation](#installation)
- [Deployment](#deployment)
- [Testing](#testing)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Decentralized Prediction Game**: Participate in "Heads or Tails" prediction pools based on real-world asset price movements
- **Minority Wins Mechanism**: Strategic gameplay where the minority choice often prevails
- **Flare Network Integration**: Utilizes Flare's Time Series Oracle (FTSO) for reliable price feeds
- **Secure Randomness**: Employs Flare's Random Number Generator for fair tiebreaking
- **Staking Mechanism**: Pool creators stake FLR tokens to create and manage pools
- **Multi-Round Elimination**: Progressive rounds with eliminations until final winners are determined
- **Transparent Prize Distribution**: Smart contract enforces automatic prize payouts
- **Multiple Asset Categories**: Support for crypto, commodities, and forex price movements
- **Creator Rewards**: Pool creators earn a percentage of the prize pool

## Technical Implementation

### Smart Contract Architecture

FlareFlip is built using Solidity with extensive use of data structures for efficient game management:

```solidity
contract FlareFlip is Ownable {
    enum PlayerChoice { NONE, HEADS, TAILS }
    enum PoolStatus { OPENED, ACTIVE, CLOSED }

    struct TradingPair { ... }
    struct MarketData { ... }
    struct Player { ... }
    struct Pool { ... }
    struct PoolInfo { ... }
    struct StakerInfo { ... }

    // Core game logic and state management
    ...
}
```

The contract uses a modular design with specialized functions for:

- Pool creation and management
- Player registration and participation
- Round resolution and winner determination
- Price feed integration and market data handling
- Staking operations and reward distribution

### Flare Network Integration

FlareFlip leverages three core Flare Network services:

1. **FTSO (Flare Time Series Oracle)**: Provides decentralized, reliable price feeds for various assets

   ```solidity
   FtsoV2Interface public ftsoV2;
   ```

2. **Random Number Generator**: Ensures fair and unpredictable outcomes for tie-breaking

   ```solidity
   RandomNumberV2Interface public randomNumberV2;
   ```

3. **Fee Calculator**: Manages the fees required for oracle data requests
   ```solidity
   IFeeCalculator public feeCalculator;
   ```

These integrations are implemented through Flare's contract registry system:

```solidity
constructor() Ownable(msg.sender) {
    ftsoV2 = ContractRegistry.getFtsoV2();
    feeCalculator = ContractRegistry.getFeeCalculator();
    randomNumberV2 = ContractRegistry.getRandomNumberV2();
    poolCount = 0;
}
```

### Game Mechanics

#### Pool Creation and Management

Stakers create prediction pools by specifying:

- Entry fee
- Maximum participants
- Asset symbol to track (e.g., BTC, ETH, XAU)

```solidity
function createPool(
    uint _entryFee,
    uint _maxParticipants,
    string memory _assetSymbol
) external onlyStaker { ... }
```

#### Minority Wins Mechanism

The unique "minority wins" mechanics work as follows:

1. All players make their prediction (HEADS or TAILS)
2. The choice with fewer votes wins
3. In case of a tie, a hybrid resolution system uses:
   - Price movement direction (from FTSO data)
   - Random number generation (from Flare's RNG)

```solidity
function _resolveRound(uint _poolId) internal {
    Pool storage pool = pools[_poolId];
    uint currentRound = pool.currentRound;

    uint headsCount = pool.headsCount[currentRound];
    uint tailsCount = pool.tailsCount[currentRound];

    PlayerChoice winningSelection;

    if(headsCount < tailsCount) {
        winningSelection = PlayerChoice.HEADS;
    } else if (tailsCount < headsCount) {
        winningSelection = PlayerChoice.TAILS;
    } else {
        winningSelection = _resolveTie(_poolId, currentRound);
    }

    _processRoundResults(_poolId, currentRound, winningSelection);
}
```

#### Multi-Round Elimination

FlareFlip implements progressive elimination rounds:

- Each round eliminates players who chose the majority option
- The game continues until the number of remaining players reaches the pre-determined winner count
- Winners split the prize pool proportionally

```solidity
function _processRoundResults(
    uint _poolId,
    uint _round,
    PlayerChoice winningSelection
) internal { ... }
```

### Staking Mechanism

The staking system:

- Requires a minimum stake (100 FLR) to create pools
- Limits stakers to managing a maximum of 3 active pools
- Enforces a minimum staking period (7 days by default)
- Rewards pool creators with a percentage of the prize pool

```solidity
function stake() external payable {
    require(msg.value >= MINIMUM_STAKE, "Stake amount below minimum");

    StakerInfo storage stakerInfo = stakers[msg.sender];
    stakerInfo.stakedAmount += msg.value;
    stakerInfo.lastStakeTimestamp = block.timestamp;

    emit Staked(msg.sender, msg.value);
}
```

## How to Play

1. **Pool Creation** - Stakers create prediction pools with specified parameters
2. **Pool Joining** - Players join pools by paying the entry fee
3. **Making Predictions** - Players choose HEADS or TAILS for each round
4. **Round Resolution** - After all active players make their choices, the round is resolved
5. **Elimination** - Players who chose the majority option are eliminated
6. **Continuing Rounds** - Rounds continue until the final winner count is reached
7. **Prize Distribution** - Winners claim their share of the prize pool

## Installation

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- Hardhat >= 2.0.0

### Setup

1. Clone the repository

```bash
git clone https://github.com/jerrymusaga/FlareFlip-.git
cd FlareFlip-
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

## Deployment

### Testing Environment

Deploy to Flare's Coston2 test network:

## Testing

Run tests using Foundry:

## Security

The FlareFlip contract implements several security mechanisms:

- **Access Control**: Uses OpenZeppelin's Ownable for admin functions
- **Input Validation**: Thorough validation of all input parameters
- **Reentrancy Protection**: Function ordering prevents reentrancy attacks
- **Fee Management**: Proper handling of oracle fees and prize distribution
- **State Management**: Careful tracking of game state to prevent exploitation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ for the Flare Network ecosystem
