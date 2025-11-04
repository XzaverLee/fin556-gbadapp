import React, { useState, useEffect } from "react";
import useDapp, { getBalance, sellTokens, buyTokens } from "./useDapp";
import { ethers, parseEther } from "ethers";

import {
    CssBaseline,
    Container,
    Card,
    Button,
    TextField,
    Box,
    Divider,
    CircularProgress,
    CardContent,
    Typography,
} from "@mui/material";

const App = () => {        

    const [signer, setSigner] = useState(null);
    const [address, setAddress] = useState(null);
    const [walletbalance, setWalletBalance] = useState(null);
    const [network, setNetwork] = useState(null);    
    const [refreshToggle, setRefreshToggle] = useState(0)
    

    // Xzaver Tokens and Pool details
    const [tokenAddrX, _setTokenAddrX] = useState(
        "0x7Be129f76C4FC82752Dd1ddCCC154F2298e2a435"
    );
    
    // George Tokens and Pool details
    const [tokenAddrG, _setTokenAddrG] = useState(
        "0x341Aac04059a1E81E6390177c4e4D1992B422d84"
    );
    
    // Ka Hian Tokens and Pool details
    const [tokenAddrKH, _setTokenAddrKH] = useState(
        "0x341dA74120EBFE04041F0D245cff62950ccfd64F"
    );

    // Mason Tokens and Pool details
    const [tokenAddrM, _setTokenAddrM] = useState(
        "0x97a47102478072710fBe2b2fE6c762b1F6cf2B06"
    );

    // Sinya Tokens and Pool details
    const [tokenAddrSY, _setTokenAddrSY] = useState(
        "0xC3c7E367D9047F8871ef553C02938189ca122f73"
    );

    const [uniswapRouterAddress, _setUniswapRouterAddress] = useState(
    "0x5b491662E508c2E405500C8BF9d67E5dF780cD8e"
    );
    const [uniswapFactoryAddress, _setUniswapFactoryAddress] = useState(
    "0x342D7aeC78cd3b581eb67655B6B7Bb157328590e"
    );
    const [WETHAddress, _setWETHAddress] = useState(
    "0x7a1fd5C3185fe6261577AccEe220844Dc9026225"
    );

    const { connect } = useDapp({ setSigner });

    useEffect(() => {
        const start = async () => {
            const result = await connect();
            if (result?.error) {
                alert(
                    "MetaMask is not installed. Please install MetaMask to use this DApp."
                );
            }
        };
        start();
    },[]);

    useEffect(() => {
        if (!signer) return;

        const wallet = async() => {
            const addr = await signer.getAddress();
            setAddress(addr);
            const bal = await signer.provider.getBalance(addr);
            setWalletBalance(ethers.formatEther(bal));
            const net = await signer.provider.getNetwork();
            const networkMap = {
                1: "Ethereum Mainnet",
                5: "Goerli Testnet",
                11155111: "Sepolia Testnet",
                137: "Polygon Mainnet",
                560048: "Hoodi Testnet",
            }
            const NetworkName = networkMap[net.chainId] || "Unknown Network";
            setNetwork(`${NetworkName} (chainId: ${net.chainId})`);
        };
        wallet();
    },[signer, refreshToggle])
        

    const [TokenDetailsX, setTokenDetailsX] = useState(null);
    useEffect(() => {
        if (!tokenAddrX || !address || !uniswapFactoryAddress) return;
        getBalance({
            TokenAddr: tokenAddrX,
            walletAddr: address,
            uniswapFactoryAddress,
        }).then(setTokenDetailsX);
    }, [tokenAddrX, address, uniswapFactoryAddress, refreshToggle]);

    const [TokenDetailsG, setTokenDetailsG] = useState(null);
    useEffect(() => {
        if (!tokenAddrG || !address || !uniswapFactoryAddress) return;
        getBalance({
            TokenAddr: tokenAddrG,
            walletAddr: address,
            uniswapFactoryAddress,
        }).then(setTokenDetailsG);
    }, [tokenAddrG, address, uniswapFactoryAddress, refreshToggle]);
    
    const [TokenDetailsKH, setTokenDetailsKH] = useState(null);
    useEffect(() => {
        if (!tokenAddrKH || !address || !uniswapFactoryAddress) return;
        getBalance({
            TokenAddr: tokenAddrKH,
            walletAddr: address,
            uniswapFactoryAddress,
        }).then(setTokenDetailsKH);
    }, [tokenAddrKH, address, uniswapFactoryAddress, refreshToggle]);

    const [TokenDetailsM, setTokenDetailsM] = useState(null);
    useEffect(() => {
        if (!tokenAddrM || !address || !uniswapFactoryAddress) return;
        getBalance({
            TokenAddr: tokenAddrM,
            walletAddr: address,
            uniswapFactoryAddress,
        }).then(setTokenDetailsM);
    }, [tokenAddrM, address, uniswapFactoryAddress, refreshToggle]);
    
    const [TokenDetailsSY, setTokenDetailsSY] = useState(null);
    useEffect(() => {
        if (!tokenAddrSY || !address || !uniswapFactoryAddress) return;
        getBalance({
            TokenAddr: tokenAddrSY,
            walletAddr: address,
            uniswapFactoryAddress,
        }).then(setTokenDetailsSY);
    }, [tokenAddrSY, address, uniswapFactoryAddress, refreshToggle]);
    
    

    const TokenNames = {
        [TokenDetailsX?.name]: tokenAddrX, 
        [TokenDetailsG?.name]: tokenAddrG,
        [TokenDetailsM?.name]: tokenAddrM, 
        [TokenDetailsSY?.name]: tokenAddrSY, 
        [TokenDetailsKH?.name]: tokenAddrKH,
        "ETH": "NativeETH",
    };

    const [FromTokenAddr, setFromTokenAddr] = useState("");
    const [FromTokenName, setFromTokenName] = useState("");
    const [ToTokenAddr, setToTokenAddr] = useState("");
    const [ToTokenName, setToTokenName] = useState("");
    const [isLoadingBuy, setIsLoadingBuy] = useState(false);
    const [isLoadingSell, setIsLoadingSell] = useState(false);
    const [Tokenamt, setTokenamt] = useState("");

    const handleFromChange = (event) => {
        setFromTokenAddr(event.target.value);
        const TokenName = Object.entries(TokenNames).find(
            ([name, addr]) => addr === event.target.value
        )?.[0] || '';
        setFromTokenName(TokenName);
    }
    const handleToChange = (event) => {
        setToTokenAddr(event.target.value);
        const TokenName = Object.entries(TokenNames).find(
            ([name, addr]) => addr === event.target.value
        )?.[0] || '';
        setToTokenName(TokenName);
    }

    const handleRefresh = async () => {
        setWalletBalance(null);
        setTokenDetailsG(null);
        setTokenDetailsKH(null);
        setTokenDetailsX(null);
        setTokenDetailsSY(null);
        setTokenDetailsM(null);
        setRefreshToggle(refreshToggle + 1);
    }

    const handleBuy = async () => {
        if (!Tokenamt) {
            alert("Invalid amount");
            return;
        }
        if (FromTokenAddr === ToTokenAddr) {
            alert("Please choose different Tokens!");
            return;
        }
        if (FromTokenAddr === "" || ToTokenAddr ==="") {
            alert("Please select Tokens to Trade");
            return;
        }
        const confirmed = window.confirm(
            `Proceed to Buy ${Tokenamt} ${ToTokenName}?`
        )
        if (confirmed) {   
            
            console.log("User confirmed Purchase. Sending Transaction...");
            setIsLoadingBuy(true);
            try {
                const Inamt = await buyTokens(
                    uniswapFactoryAddress, 
                    uniswapRouterAddress, 
                    WETHAddress,
                    FromTokenAddr,
                    parseEther(Tokenamt),
                    ToTokenAddr,
                    signer
                );
                console.log(`Bought ${parseEther(Tokenamt)} of ${ToTokenAddr} for ${Inamt} of ${FromTokenAddr}`);
                return;
            } catch (error) {
                console.error("Error buying tokens:", error);
                alert("Failed to buy tokens. Please try again.");
            } finally {
                setIsLoadingBuy(false);
            }
        } else {
            console.log("Swap cancelled by user.");
        };
    };

    const handleSell = async () => {
        if (!Tokenamt) {
            alert("Invalid amount");
            return;
        }
        if (FromTokenAddr === ToTokenAddr) {
            alert("Please choose different Tokens!");
            return;
        }
        if (FromTokenAddr === "" || ToTokenAddr ==="") {
            alert("Please select Tokens to Trade");
            return;
        }
        const confirmed = window.confirm(
            `Proceed to Sell ${Tokenamt} ${FromTokenName}?`
        )
        if (confirmed) {   
            
            console.log("User confirmed Sale. Sending Transaction...");
            setIsLoadingSell(true);
            try {
                const Outamt = await sellTokens(
                    uniswapFactoryAddress, 
                    uniswapRouterAddress, 
                    WETHAddress,
                    parseEther(Tokenamt),
                    FromTokenAddr,
                    ToTokenAddr,
                    signer
                );
                console.log(`Sold ${parseEther(Tokenamt)} of ${FromTokenAddr} for ${Outamt} of ${ToTokenAddr}`);
                return;
            } catch (error) {
                console.error("Error selling tokens:", error);
                alert("Failed to sell tokens. Please try again.");
            } finally {
                setIsLoadingSell(false);
            }
        } else {
            console.log("Swap cancelled by user.");
        };
    };

    return (
    <>
        <CssBaseline />
        <Container>
            <h1>GROUP 2 DAPP</h1>
            <p>Connected to Metamask with address: {address || "Loading..."}</p>
            <p>Network: {network || "Loading..."}</p>
            <p>Wallet Balance: {walletbalance || "Loading..."} ETH</p>
            <h2 style={{ marginBottom: "16px" }}>Contract Configuration (UniswapV2Router02)</h2>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <h4 style={{ marginTop: "20px", marginBottom: "5px" }}>
                    Uniswap Router Address
                </h4>
                <Card sx={{ p: 3, flexGrow: 1 }}>
                    <ul style={{ margin: 0, paddingLeft: "2px" }}>
                        {uniswapRouterAddress}
                    </ul>
                </Card>
            </Box>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <h4 style={{ marginTop: "20px", marginBottom: "5px" }}>
                    Uniswap Factory Address
                </h4>
                <Card sx={{ p: 3, flexGrow: 1 }}>
                    <ul style={{ margin: 0, paddingLeft: "2px" }}>
                        {uniswapFactoryAddress}
                    </ul>
                </Card>
            </Box>
            <Divider sx={{ my: 3 }} />  
            <Box>                        
                <h2 style={{ marginBottom: "16px" }}>Token Details</h2>
                <Button
                    onClick={handleRefresh}
                    variant='contained'
                >
                    Check
                </Button>
            </Box>  
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 2,
                }}
            >   
                <Card sx= {{flex:1, minWidth:120, textAlign: "center",p: 2,}}>
                    <Typography variant="body1" component="div">
                        {TokenDetailsX?.name || "Loading..."} <br />
                        <Typography
                            component="span"
                            variant="caption"
                            sx={{ wordBreak: "break-all"}}
                        >
                            {tokenAddrX}
                        </Typography>
                        <ul style = {{margin:0, paddingLeft:"20px"}}>
                            <li>Symbol: {TokenDetailsX?.symbol}</li>
                            <li>Decimals: {TokenDetailsX?.decimal}</li>
                            <li>Balance: {TokenDetailsX?.balance}</li>
                        </ul>
                    </Typography>
                </Card>
                <Card sx= {{flex:1, minWidth:120, textAlign: "center",p: 2,}}>
                    <Typography variant="body1" component="div">
                        {TokenDetailsG?.name || "Loading..."}<br />
                        <Typography
                            component="span"
                            variant="caption"
                            sx={{ wordBreak: "break-all"}}
                        >
                            {tokenAddrG}
                        </Typography>
                        <ul style = {{margin:0, paddingLeft:"20px"}}>
                            <li>Symbol: {TokenDetailsG?.symbol}</li>
                            <li>Decimals: {TokenDetailsG?.decimal}</li>
                            <li>Balance: {TokenDetailsG?.balance}</li>
                        </ul>
                    </Typography>
                </Card>
                <Card sx= {{flex:1, minWidth:120, textAlign: "center",p: 2,}}>
                    <Typography variant="body1" component="div">
                        {TokenDetailsM?.name || "Loading..."}<br />
                        <Typography
                            component="span"
                            variant="caption"
                            sx={{ wordBreak: "break-all"}}
                        >
                            {tokenAddrM}
                        </Typography>
                        <ul style = {{margin:0, paddingLeft:"20px"}}>
                            <li>Symbol: {TokenDetailsM?.symbol}</li>
                            <li>Decimals: {TokenDetailsM?.decimal}</li>
                            <li>Balance: {TokenDetailsM?.balance}</li>
                        </ul>
                    </Typography>
                </Card>
                <Card sx= {{flex:1, minWidth:120, textAlign: "center",p: 2,}}>
                    <Typography variant="body1" component="div">
                        {TokenDetailsSY?.name || "Loading..."}<br />
                        <Typography
                            component="span"
                            variant="caption"
                            sx={{ wordBreak: "break-all"}}
                        >
                            {tokenAddrSY}
                        </Typography>
                        <ul style = {{margin:0, paddingLeft:"20px"}}>
                            <li>Symbol: {TokenDetailsSY?.symbol}</li>
                            <li>Decimals: {TokenDetailsSY?.decimal}</li>
                            <li>Balance: {TokenDetailsSY?.balance}</li>
                        </ul>
                    </Typography>
                </Card>
                <Card sx= {{flex:1, minWidth:120, textAlign: "center",p: 2,}}>
                    <Typography variant="body1" component="div">
                        {TokenDetailsKH?.name || "Loading..."}<br />
                        <Typography
                            component="span"
                            variant="caption"
                            sx={{ wordBreak: "break-all"}}
                        >
                            {tokenAddrKH}
                        </Typography>
                        <ul style = {{margin:0, paddingLeft:"20px"}}>
                            <li>Symbol: {TokenDetailsKH?.symbol}</li>
                            <li>Decimals: {TokenDetailsKH?.decimal}</li>
                            <li>Balance: {TokenDetailsKH?.balance}</li>
                        </ul>
                    </Typography>
                </Card>
            </Box>
            <h2 style={{ marginBottom: "16px" }}>Pool Info</h2>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 2,
                }}
            > 
                <Card sx= {{flex:1, minWidth:120, textAlign: "center",p: 2,}}>
                    <Typography variant="body1" component="div">
                        {TokenDetailsX?.name ? "WETH / " + TokenDetailsX?.name : "Loading..."} <br />
                        {TokenDetailsX?.WETHReserve} / {TokenDetailsX?.tokenreserve} <br />
                        TOKEN → ETH: <br />
                        {TokenDetailsX?.tokenprice}<br />
                        ETH → TOKEN: <br />
                        {TokenDetailsX?.WETHprice}<br />
                    </Typography>
                </Card>
                <Card sx= {{flex:1, minWidth:120, textAlign: "center",p: 2,}}>
                    <Typography variant="body1" component="div">
                        {TokenDetailsG?.name ? "WETH / " + TokenDetailsG?.name : "Loading..."} <br />
                        {TokenDetailsG?.WETHReserve} / {TokenDetailsG?.tokenreserve} <br />
                        TOKEN → ETH: <br />
                        {TokenDetailsG?.tokenprice}<br />
                        ETH → TOKEN: <br />
                        {TokenDetailsG?.WETHprice}<br />
                    </Typography>
                </Card>
                <Card sx= {{flex:1, minWidth:120, textAlign: "center",p: 2,}}>
                    <Typography variant="body1" component="div">
                        {TokenDetailsM?.name ? "WETH / " + TokenDetailsM?.name : "Loading..."} <br />
                        {TokenDetailsM?.WETHReserve} / {TokenDetailsM?.tokenreserve} <br />
                        TOKEN → ETH: <br />
                        {TokenDetailsM?.tokenprice}<br />
                        ETH → TOKEN: <br />
                        {TokenDetailsM?.WETHprice}<br />
                    </Typography>
                </Card>
                <Card sx= {{flex:1, minWidth:120, textAlign: "center",p: 2,}}>
                    <Typography variant="body1" component="div">
                        {TokenDetailsSY?.name ? "WETH / " + TokenDetailsSY?.name : "Loading..."} <br />
                        {TokenDetailsSY?.WETHReserve} / {TokenDetailsSY?.tokenreserve} <br />
                        TOKEN → ETH: <br />
                        {TokenDetailsSY?.tokenprice}<br />
                        ETH → TOKEN: <br />
                        {TokenDetailsSY?.WETHprice}<br />
                    </Typography>
                </Card>
                <Card sx= {{flex:1, minWidth:120, textAlign: "center",p: 2,}}>
                    <Typography variant="body1" component="div">
                        {TokenDetailsKH?.name ? "WETH / " + TokenDetailsKH?.name : "Loading..."} <br />
                        {TokenDetailsKH?.WETHReserve} / {TokenDetailsKH?.tokenreserve} <br />
                        TOKEN → ETH: <br />
                        {TokenDetailsKH?.tokenprice}<br />
                        ETH → TOKEN: <br />
                        {TokenDetailsKH?.WETHprice}<br />
                    </Typography>
                </Card>
            </Box>
            <Divider sx={{ my: 3 }} />
            <h2 style={{ marginBottom: "16px" }}>Token Swap</h2>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <select value={FromTokenAddr} onChange={handleFromChange}>
                    <option value="">--Swap From--</option>
                    {Object.entries(TokenNames).map(([TokenName, tokenAddr]) => (
                        <option key={TokenName} value={tokenAddr}>
                            {TokenName}
                        </option>
                    ))}
                </select>
                <select value={ToTokenAddr} onChange={handleToChange}>
                    <option value="">--Swap To--</option>
                    {Object.entries(TokenNames).map(([TokenName, tokenAddr]) => (
                        <option key={TokenName} value={tokenAddr}>
                            {TokenName}
                        </option>
                    ))}
                </select>
                <TextField 
                    id='amt' 
                    label='Swap Amount' 
                    fullWidth 
                    onChange={(e) => {
                        setTokenamt(e.target.value);
                    }}
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                    {isLoadingBuy ? (
                        <CircularProgress />
                    ) : (
                        <Button 
                            variant='contained'
                            onClick={() => handleBuy()}
                        >
                            Buy
                        </Button>
                    )}
                    {isLoadingSell ? (
                        <CircularProgress />
                    ) : (
                        <Button 
                            variant='outlined'
                            onClick={() => handleSell()}
                        >
                            Sell
                        </Button>
                    )}
                </Box>
            </Box>
        </Container>
    </>
    );
}
export default App;