// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "dependencies/forge-std-1.9.5/src/Script.sol";
import "../src/FlareFlip.sol";

contract DeployFlareFlip is Script {
    address constant FLARE_FTSO_V2 = 0xC4e9c78EA53db782E28f28Fdf80BaF59336B304d; 
    address constant FLARE_FEE_CALCULATOR = 0x88A9315f96c9b5518BBeC58dC6a914e13fAb13e2;
    address constant FLARE_RANDOM = 0x97702e350CaEda540935d92aAf213307e9069784;
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        FlareFlip flareFlip = new FlareFlip();

        flareFlip.setFtsoV2(FLARE_FTSO_V2);
        flareFlip.setFeeCalculator(FLARE_FEE_CALCULATOR);
        flareFlip.setRandomNumberProvider(FLARE_RANDOM);
        
        // Add initial supported assets using hex string literals
        flareFlip.addSupportedAsset(1, "Crypto", "FLR", hex"01464c522f55534400000000000000000000000000");
        flareFlip.addSupportedAsset(1, "Crypto", "BTC", hex"014254432f55534400000000000000000000000000");
        flareFlip.addSupportedAsset(1, "Crypto", "ETH", hex"014554482f55534400000000000000000000000000");
        flareFlip.addSupportedAsset(1, "Crypto", "SGB", hex"015347422f55534400000000000000000000000000");
        flareFlip.addSupportedAsset(1, "Crypto", "XRP", hex"015852502f55534400000000000000000000000000");
        flareFlip.addSupportedAsset(1, "Crypto", "SOL", hex"01534f4c2f55534400000000000000000000000000");
        // Configuration
        flareFlip.setCreatorFeePercentage(500); // 5%
        flareFlip.setMinimumStakingPeriod(5 days);
        
        vm.stopBroadcast();
    }
}