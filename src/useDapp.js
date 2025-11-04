
import { ethers, formatUnits } from "ethers";

const useDapp = ({ setSigner }) => {
    const provider = window.ethereum
        ? new ethers.BrowserProvider(window.ethereum)
        : null;

    const connect = async () => {
        if (!provider) return null;
            
        
        await provider.send("eth_requestAccounts", []); // Login to metamask
        const signer = await provider.getSigner();

        const { chainId } = await provider.getNetwork();
        console.log("Connected to chainId:", chainId);

        const DESIRED_CHAIN_ID = "0x88bb0"; 
        if (chainId !== BigInt(DESIRED_CHAIN_ID)) {
            try{
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: DESIRED_CHAIN_ID}]
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request ({
                            method: "wallet_addEthereumChain",
                            params: [{
                                chainId: DESIRED_CHAIN_ID,
                                chainName: "Hoodi Testnet",
                                rpcUrls: ["https://rpc.hoodi.ethpandaops.io"],
                                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                                blockExplorerUrls: ["https://hoodi.etherscan.io"]
                            }]
                        });
                    } catch (addError) {
                        console.error("User rejected adding network",addError);
                    }
                } else {
                    console.error("User rejected network switch", switchError);
                }
            }
            
            await provider.send("wallet_switchEthereumChain", [
                { chainId: DESIRED_CHAIN_ID }, // Must be in hex format
            ]);
        }
        setSigner(signer);

        return signer;
    };
    return {
        connect,
    };
};

export const getBalance = async ({ 
    TokenAddr,
    walletAddr,
    uniswapFactoryAddress
}) => {
    const provider = window.ethereum
        ? new ethers.BrowserProvider(window.ethereum)
        : null;
    
    await provider.send("wallet_switchEthereumChain", [
            { chainId: "0x88bb0" }, // Must be in hex format
        ]);

    const TokenABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function balanceOf(address) view returns (uint256)"
    ];

    const TokenContract = new ethers.Contract(TokenAddr, TokenABI, provider);
    
    const TokenName = await TokenContract.name();
    const TokenSymbol = await TokenContract.symbol();
    const TokenDecimal = await TokenContract.decimals();
    const Tokenbalance = await TokenContract.balanceOf(walletAddr);
    const dispbalance = formatUnits(Tokenbalance, TokenDecimal);
    
    const wethAddr = "0x7a1fd5C3185fe6261577AccEe220844Dc9026225"
    const factory = new ethers.Contract(
        uniswapFactoryAddress, 
        ["function getPair(address, address) view returns(address)"],
        provider
    );
    
    let liq, TokenReserve, WETHReserve, priceTokenInWETH, priceWETHInToken; 
    if (TokenAddr !== wethAddr) {
        const poolAddr = await factory.getPair(TokenAddr, wethAddr);
        if (poolAddr === ethers.ZeroAddress ) {
            liq = 0;
            TokenReserve = 0;
            WETHReserve = 0;
            console.log("Pool does not exist yet for", TokenAddr, "and WETH")
        } else {
            const pool = new ethers.Contract(
                poolAddr,[
                    "function getReserves() view returns(uint112 reserve0, uint112 reserve1, uint32)",
                    "function balanceOf(address) view returns(uint)",
                    "function token0() view returns (address)",
                ],
                provider
            );

            const { reserve0, reserve1 } = await pool.getReserves();
            const token0 = await pool.token0();

            if (token0 === wethAddr) {
                WETHReserve = ethers.formatEther(reserve0);
                TokenReserve = ethers.formatEther(reserve1);
            } else {
                WETHReserve = ethers.formatEther(reserve1);
                TokenReserve = ethers.formatEther(reserve0);
            }
            liq = await pool.balanceOf(poolAddr)
            priceTokenInWETH = Number(WETHReserve) / Number(TokenReserve);
            priceWETHInToken = Number(TokenReserve) / Number(WETHReserve);
        }
    }
    return {
        name: TokenName.toString(),
        symbol: TokenSymbol.toString(),
        decimal: TokenDecimal.toString(),
        balance: Number(dispbalance).toFixed(5),
        liquidity: liq?.toString(),
        tokenreserve: Number(TokenReserve)?.toFixed(5),
        WETHReserve: Number(WETHReserve)?.toFixed(5),
        tokenprice: priceTokenInWETH?.toFixed(5),
        WETHprice: priceWETHInToken?.toFixed(5),
    };
};

function _getAmountOut(amountIn, reserveIn, reserveOut) {
    if (!amountIn || !reserveIn || !reserveOut) {
        throw new Error(
            "Invalid input: amountIn, reserveIn, and reserveOut must be provided"
        );
    }
    const amountInWithFee = amountIn * 997n;
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * 1000n + amountInWithFee;
    return numerator / denominator;
}

const _getReserves = async (factory, wethAddr, { TOKEN_0, TOKEN_1 }, account) => {
      
    const poolAddress = await factory.getPair(TOKEN_0, TOKEN_1);
    if (poolAddress === ethers.ZeroAddress) {
        throw new Error("No pool found for the given token pair");
    }
    const pool = new ethers.Contract(
        poolAddress,
        [
            "function getReserves() view returns(uint112 reserve0,uint112 reserve1,uint32)",
            "function token0() view returns (address)",
        ],
        account
    );
    const { reserve0, reserve1 } = await pool.getReserves();
    const token0 = await pool.token0();
    
    let WETHReserve, TokenReserve;
    if (token0 === wethAddr) {
        WETHReserve = reserve0;
        TokenReserve = reserve1;
    } else {
        WETHReserve = reserve1;
        TokenReserve = reserve0;
    }
    return {WETHReserve, TokenReserve,};
};

export const sellTokens = async (
    uniswapFactoryAddress, 
    uniswapRouterAddress, 
    wethAddr,
    inputAmt, 
    inputAddr, 
    outputAddr, 
    account
) => {
    console.log(`Selling ${inputAmt} of ${inputAddr} for ${outputAddr}`);
    const slippage = 1n; // 1%
 
    const provider = window.ethereum
        ? new ethers.BrowserProvider(window.ethereum)
        : null;
    
    await provider.send("wallet_switchEthereumChain", [
            { chainId: "0x88bb0" }, // Must be in hex format
        ]);

    // Get Reserves
    const factory = new ethers.Contract(
        uniswapFactoryAddress,
        ["function getPair(address,address) view returns(address)"],
        account
    );

    const uniswap = new ethers.Contract(
        uniswapRouterAddress,
        [
            `function swapExactTokensForTokens(uint,uint,address[],address,uint)`,
            `function swapExactETHForTokens(uint,address[],address,uint)`,
            `function swapExactTokensForETH(uint,uint,address[],address,uint)`
        ],
        account
    );
    const walletAddr = await account.getAddress();
    let inputToken, inputbal;
    if (inputAddr !== "NativeETH") {
        inputToken = new ethers.Contract(
            inputAddr,
            [
                "function approve(address,uint)",
                "function balanceOf(address account) view returns (uint256)"
            ],
            account
        );

        inputbal = await inputToken.balanceOf(walletAddr);
    } else {
        inputbal = await account.provider.getBalance(walletAddr);
    }
    if (inputAmt > inputbal) {
        alert("Insufficient Balance to sell!");
        return;
    };
    

    let amountOut, amountOutMin, path, response, ts;
    

        // Get OutputAmt
    if (inputAddr === "NativeETH") {

        const reserves = await _getReserves(
            factory,
            wethAddr,
            {
                TOKEN_0: wethAddr,
                TOKEN_1: outputAddr,
            },
            account
        );

        console.log("Reserves:", reserves);

        if (!reserves || !reserves.WETHReserve || !reserves.TokenReserve) {
            throw new Error("Failed to fetch reserves from the pool");
        }
        amountOut = await _getAmountOut(
            inputAmt,
            reserves.WETHReserve,
            reserves.TokenReserve,
        );
        
        if (amountOut > reserves.TokenReserve) {
            alert("Insufficient Token Reserves in pool to buy!");
            return;
        };
        console.log(
            `Getting ${amountOut} of ${outputAddr} for selling ${inputAmt} of ${inputAddr}`
        )
        path = [wethAddr, outputAddr];
        amountOutMin = amountOut * (100n - slippage) / 100n;
        const overrides = {
            value: inputAmt
        };
        ts = (await provider.getBlock()).timestamp + 1000;
        await uniswap.swapExactETHForTokens(
            amountOutMin,
            path,
            walletAddr,
            ts,
            overrides
        );
    } else if (outputAddr === "NativeETH") {

        const reserves = await _getReserves(
            factory,
            wethAddr,
            {
                TOKEN_0: inputAddr,
                TOKEN_1: wethAddr,
            },
            account
        );

        console.log("Reserves:", reserves);

        if (!reserves || !reserves.WETHReserve || !reserves.TokenReserve) {
            throw new Error("Failed to fetch reserves from the pool");
        }
        amountOut = await _getAmountOut(
            inputAmt,
            reserves.TokenReserve,
            reserves.WETHReserve,
        );
        if (amountOut > reserves.WETHReserve) {
            alert("Insufficient WETH Reserves in pool to buy!");
            return;
        }; 
        response = await inputToken.approve(
            uniswapRouterAddress,
            inputAmt
        );
        await response.wait();
        console.log("trade: approved. receipt=", response.hash);

        console.log(
            `Approve router ${uniswapRouterAddress} to spend ${inputAmt} of ${inputAddr}`
        );
        console.log(
            `Getting ${amountOut} of ${outputAddr} for selling ${inputAmt} of ${inputAddr}`
        )
        path = [inputAddr, wethAddr];
        amountOutMin = amountOut * (100n - slippage) / 100n;
        ts = (await provider.getBlock()).timestamp + 1000;
        await uniswap.swapExactTokensForETH(
            inputAmt,
            amountOutMin,
            path,
            walletAddr,
            ts,
            { value: 0},
        )
    
 
    } else {
        const reservesIn = await _getReserves(
            factory,
            wethAddr,
            {
                TOKEN_0: inputAddr,
                TOKEN_1: wethAddr,
            },
            account
        );

        const reservesOut = await _getReserves(
            factory,
            wethAddr,
            {
                TOKEN_0: outputAddr,
                TOKEN_1: wethAddr,
            },
            account
        );

        console.log("Reserves In:", reservesIn);
        console.log("Reserves Out:", reservesOut);

        if (!reservesIn || !reservesIn.WETHReserve || !reservesIn.TokenReserve 
            || !reservesOut || !reservesOut.WETHReserve || !reservesOut.TokenReserve) {
            throw new Error("Failed to fetch reserves from the pool");
        }

        // Get OutputAmt0
        const amountOut0 = await _getAmountOut(
            inputAmt,
            reservesIn.TokenReserve,
            reservesIn.WETHReserve,
        );
        if (amountOut0 > reservesIn.WETHReserve) {
            alert("Insufficient WETH Reserves in 1st pool to buy!");
            return;
        };
        if (amountOut0 > reservesOut.WETHReserve) {
            alert("Insufficient WETH Reserves in 2nd pool to sell!");
            return;
        }
        // Get OutputFinalAmt
        amountOut = await _getAmountOut(
            amountOut0,
            reservesOut.WETHReserve,
            reservesOut.TokenReserve,
        );
        
        if (amountOut > reservesOut.TokenReserve) {
            alert("Insufficient Token Reserves in 2nd pool to buy!");
            return;
        };
        path = [inputAddr, wethAddr, outputAddr];
        // Approve router to withdraw from trader account
        
        response = await inputToken.approve(
            uniswapRouterAddress,
            inputAmt
        );
        await response.wait();
        console.log("trade: approved. receipt=", response.hash);
        console.log(
            `Approve router ${uniswapRouterAddress} to spend ${inputAmt} of ${inputAddr}`
        );

        // Load contract A and contract B
        console.log(
            `Getting ${amountOut} of ${outputAddr} for selling ${inputAmt} of ${inputAddr}`
        )
        
        
        amountOutMin = amountOut * (100n - slippage) / 100n;

        // Trade Token using trader account
        ts = (await provider.getBlock()).timestamp + 1000;
        await uniswap.swapExactTokensForTokens(
            inputAmt,
            amountOutMin,
            path,
            walletAddr,
            ts
        );
    }
    return amountOut;
};

function _getAmountIn(reserveIn, amountOut, reserveOut) {
    if (!amountOut || !reserveIn || !reserveOut) {
        throw new Error(
            "Invalid input: reserveIn, amountOut, and reserveOut must be provided"
        );
    }

    const numerator = reserveIn * amountOut * 1000n;
    const denominator = (reserveOut - amountOut) * 997n;
    return (numerator / denominator) + 1n;
}

export const buyTokens = async (
    uniswapFactoryAddress, 
    uniswapRouterAddress, 
    wethAddr,
    inputAddr, 
    outputAmt,
    outputAddr, 
    account
) => {
    console.log(`Buying ${outputAmt} of ${outputAddr} for ${inputAddr}`);
    const slippage = 1010n; // 1%
    const provider = window.ethereum
        ? new ethers.BrowserProvider(window.ethereum)
        : null;
    
    await provider.send("wallet_switchEthereumChain", [
            { chainId: "0x88bb0" }, // Must be in hex format
        ]);

    // Get Reserves
    const factory = new ethers.Contract(
        uniswapFactoryAddress,
        ["function getPair(address,address) view returns(address)"],
        account
    );

    const uniswap = new ethers.Contract(
        uniswapRouterAddress,
        [
            `function swapTokensForExactTokens(uint,uint,address[],address,uint)`,
            `function swapETHForExactTokens(uint, address[], address, uint)`,
            'function swapTokensForExactETH(uint, uint, address[], address, uint)'
        ],
        account
    );
    let inputbal, inputToken;
    const walletAddr = await account.getAddress();
    if (inputAddr !== "NativeETH") {
        inputToken = new ethers.Contract(
            inputAddr,
            [
                "function approve(address,uint)",
                "function balanceOf(address account) view returns (uint256)"
            ],
            account
        );   
        inputbal = await inputToken.balanceOf(walletAddr)
    } else {
        inputbal = await account.provider.getBalance(walletAddr);
    }
    let amountIn, path, response, amountInMax, ts ;        
        
    if (inputAddr === "NativeETH") {
        const reserves = await _getReserves(
            factory,
            wethAddr,
            {
                TOKEN_0: wethAddr,
                TOKEN_1: outputAddr,
            },
            account
        );

        console.log("Reserves:", reserves);

        if (!reserves || !reserves.WETHReserve || !reserves.TokenReserve) {
            throw new Error("Failed to fetch reserves from the pool");
        };

        if (outputAmt > reserves.TokenReserve) {
            alert("Insufficient Token Reserves in pool to buy!");
            return
        };
        amountIn = await _getAmountIn(
            reserves.WETHReserve,
            outputAmt,  
            reserves.TokenReserve,
        );
        
        console.log(
            `Buying ${outputAmt} of ${outputAddr} using ${amountIn} of ${inputAddr}`
        )
        
        path = [wethAddr, outputAddr]
        amountInMax = (amountIn * slippage) / 1000n;
        

        if (amountInMax > inputbal) {
            alert("Insufficient Token Balance to sell!");
            return;
        }
        const overrides = {
            value: amountInMax
        }
        // Trade Token using trader account
        const ts = (await provider.getBlock()).timestamp + 1000;
        await uniswap.swapETHForExactTokens(
            outputAmt,
            path,
            walletAddr,
            ts,
            overrides
        );


    } else if (outputAddr === "NativeETH") {
        const reserves = await _getReserves(
            factory,
            wethAddr,
            {
                TOKEN_0: wethAddr,
                TOKEN_1: inputAddr,
            },
            account
        );

        console.log("Reserves:", reserves);

        if (!reserves || !reserves.WETHReserve || !reserves.TokenReserve) {
            throw new Error("Failed to fetch reserves from the pool");
        };
        if (outputAmt > reserves.WETHReserve) {
            alert("Insufficient WETH Reserves in pool to buy!");
            return;
        };
        amountIn = await _getAmountIn(
            reserves.TokenReserve,
            outputAmt,
            reserves.WETHReserve,
        );
        


        if (amountIn > inputbal) {
            alert("Insufficient Token Balance to sell!");
            return;
        }
        path = [inputAddr, wethAddr];

        // Approve router to withdraw from trader account
        
        response = await inputToken.approve(
            uniswapRouterAddress,
            amountIn
        );
        await response.wait();
        console.log("trade: approved. receipt=", response.hash);

        console.log(
            `Approve router ${uniswapRouterAddress} to spend ${amountIn} of ${inputAddr}`
        );
        console.log(
            `Buying ${outputAmt} of ${outputAddr} using ${amountIn} of ${inputAddr}`
        )
        
        
        amountInMax = (amountIn * slippage) / 1000n;

        if (amountInMax > inputbal) {
            alert("Insufficient Token Balance to sell!");
            return;
        }
        // Trade Token using trader account
        const ts = (await provider.getBlock()).timestamp + 1000;
        await uniswap.swapTokensForExactETH(
            outputAmt,
            amountInMax,
            path,
            walletAddr,
            ts
        );

    } else {
        const reservesIn = await _getReserves(
            factory,
            wethAddr,
            {
                TOKEN_0: inputAddr,
                TOKEN_1: wethAddr,
            },
            account
        );

        const reservesOut = await _getReserves(
            factory,
            wethAddr,
            {
                TOKEN_0: outputAddr,
                TOKEN_1: wethAddr,
            },
            account
        );

        console.log("Reserves In:", reservesIn);
        console.log("Reserves Out:", reservesOut);

        if (!reservesIn || !reservesIn.WETHReserve || !reservesIn.TokenReserve 
            || !reservesOut || !reservesOut.WETHReserve || !reservesOut.TokenReserve) {
            throw new Error("Failed to fetch reserves from the pool");
        }

        // Get OutputAmt0
        if (outputAmt > reservesOut.TokenReserve) {
            alert("Insufficient Token Reserves in 2nd pool to buy!");
            return;
        };
        const amountIn0 = await _getAmountIn(
            reservesOut.WETHReserve,
            outputAmt,
            reservesOut.TokenReserve,
        );
        if (amountIn0 > reservesOut.WETHReserve) {
            alert("Insufficient WETH Reserves in 2nd pool to sell!");
            return;
        }
        // Get OutputFinalAmt
        if (amountIn0 > reservesIn.WETHReserve) {
            alert("Insufficient WETH Reserves in 1st pool to buy!");
            return;
        }
        amountIn = await _getAmountIn(
            reservesIn.TokenReserve,
            amountIn0,
            reservesIn.WETHReserve,
        );
        
        path = [inputAddr, wethAddr, outputAddr];
        // Approve router to withdraw from trader account

        response = await inputToken.approve(
            uniswapRouterAddress,
            amountIn
        );
        await response.wait();
        console.log("trade: approved. receipt=", response.hash);

        // Load contract A and contract B
        console.log(
            `Approve router ${uniswapRouterAddress} to spend ${amountIn} of ${inputAddr}`
        );
        console.log(
            `Buying ${outputAmt} of ${outputAddr} using ${amountIn} of ${inputAddr}`
        )
        
        
        amountInMax = (amountIn * slippage) / 1000n;


        if (amountInMax > inputbal) {
            alert("Insufficient Token Balance to sell!");
            return;
        }
        // Trade Token using trader account
        ts = (await provider.getBlock()).timestamp + 1000;
        await uniswap.swapTokensForExactTokens(
            outputAmt,
            amountInMax,
            path,
            walletAddr,
            ts
        );
    };
    return amountIn;
    
};
export default useDapp;
