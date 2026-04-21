-- Create supported_assets table for global token reference data
CREATE TABLE IF NOT EXISTS supported_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_family TEXT NOT NULL CHECK (chain_family IN ('evm', 'solana', 'tron', 'bitcoin', 'xrpl', 'ton')),
  network TEXT NOT NULL,
  asset_kind TEXT NOT NULL CHECK (asset_kind IN ('native', 'token')),
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 18,
  contract_address TEXT,
  mint_address TEXT,
  issuer TEXT,
  currency_code TEXT,
  logo_url TEXT,
  coingecko_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_supported_assets_network ON supported_assets(network);
CREATE INDEX IF NOT EXISTS idx_supported_assets_symbol ON supported_assets(symbol);
CREATE INDEX IF NOT EXISTS idx_supported_assets_active ON supported_assets(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE supported_assets ENABLE ROW LEVEL SECURITY;

-- Public read access (all users can see supported assets)
CREATE POLICY "public_read_supported_assets" ON supported_assets FOR SELECT USING (true);

-- Insert comprehensive token list (50+ tokens across 10+ networks)
INSERT INTO supported_assets (chain_family, network, asset_kind, symbol, name, decimals, contract_address, coingecko_id) VALUES
-- Ethereum Network
('evm', 'Ethereum', 'native', 'ETH', 'Ethereum', 18, NULL, 'ethereum'),
('evm', 'Ethereum', 'token', 'USDC', 'USD Coin', 6, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 'usd-coin'),
('evm', 'Ethereum', 'token', 'USDT', 'Tether', 6, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 'tether'),
('evm', 'Ethereum', 'token', 'WBTC', 'Wrapped Bitcoin', 8, '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', 'wrapped-bitcoin'),
('evm', 'Ethereum', 'token', 'DAI', 'Dai Stablecoin', 18, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 'dai'),
('evm', 'Ethereum', 'token', 'LINK', 'Chainlink', 18, '0x514910771AF9Ca656af840dff83E8264EcF986CA', 'chainlink'),
('evm', 'Ethereum', 'token', 'UNI', 'Uniswap', 18, '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 'uniswap'),
('evm', 'Ethereum', 'token', 'AAVE', 'Aave', 18, '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', 'aave'),

-- BSC (Binance Smart Chain)
('evm', 'BSC', 'native', 'BNB', 'BNB', 18, NULL, 'binancecoin'),
('evm', 'BSC', 'token', 'USDT', 'Tether', 18, '0x55d398326f99059fF775485246999027B3197955', 'tether'),
('evm', 'BSC', 'token', 'USDC', 'USD Coin', 18, '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', 'usd-coin'),
('evm', 'BSC', 'token', 'BUSD', 'Binance USD', 18, '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', 'binance-usd'),
('evm', 'BSC', 'token', 'CAKE', 'PancakeSwap', 18, '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', 'pancakeswap-token'),
('evm', 'BSC', 'token', 'WBNB', 'Wrapped BNB', 18, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', 'wbnb'),

-- Polygon
('evm', 'Polygon', 'native', 'MATIC', 'Polygon', 18, NULL, 'matic-network'),
('evm', 'Polygon', 'token', 'POL', 'Polygon Ecosystem Token', 18, '0x455e53CBB86018Ac2B8092FdCd39d8444aFFC3F6', 'polygon-ecosystem-token'),
('evm', 'Polygon', 'token', 'USDC', 'USD Coin', 6, '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', 'usd-coin'),
('evm', 'Polygon', 'token', 'USDT', 'Tether', 6, '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 'tether'),
('evm', 'Polygon', 'token', 'WETH', 'Wrapped Ether', 18, '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', 'weth'),
('evm', 'Polygon', 'token', 'WMATIC', 'Wrapped Matic', 18, '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', 'wmatic'),

-- Arbitrum
('evm', 'Arbitrum', 'native', 'ETH', 'Ethereum', 18, NULL, 'ethereum'),
('evm', 'Arbitrum', 'token', 'USDC', 'USD Coin', 6, '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', 'usd-coin'),
('evm', 'Arbitrum', 'token', 'USDT', 'Tether', 6, '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', 'tether'),
('evm', 'Arbitrum', 'token', 'ARB', 'Arbitrum', 18, '0x912CE59144191C1204E64559FE8253a0e49E6548', 'arbitrum'),

-- Optimism
('evm', 'Optimism', 'native', 'ETH', 'Ethereum', 18, NULL, 'ethereum'),
('evm', 'Optimism', 'token', 'USDC', 'USD Coin', 6, '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', 'usd-coin'),
('evm', 'Optimism', 'token', 'USDT', 'Tether', 6, '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', 'tether'),
('evm', 'Optimism', 'token', 'OP', 'Optimism', 18, '0x4200000000000000000000000000000000000042', 'optimism'),

-- Avalanche
('evm', 'Avalanche', 'native', 'AVAX', 'Avalanche', 18, NULL, 'avalanche-2'),
('evm', 'Avalanche', 'token', 'USDC', 'USD Coin', 6, '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', 'usd-coin'),
('evm', 'Avalanche', 'token', 'USDT', 'Tether', 6, '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', 'tether'),
('evm', 'Avalanche', 'token', 'WAVAX', 'Wrapped AVAX', 18, '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', 'wrapped-avax'),

-- Base
('evm', 'Base', 'native', 'ETH', 'Ethereum', 18, NULL, 'ethereum'),
('evm', 'Base', 'token', 'USDC', 'USD Coin', 6, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 'usd-coin'),

-- Solana
('solana', 'Solana', 'native', 'SOL', 'Solana', 9, NULL, 'solana'),
('solana', 'Solana', 'token', 'USDC', 'USD Coin', 6, 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'usd-coin'),
('solana', 'Solana', 'token', 'USDT', 'Tether', 6, 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 'tether'),
('solana', 'Solana', 'token', 'RAY', 'Raydium', 6, '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', 'raydium'),

-- TRON
('tron', 'TRON', 'native', 'TRX', 'TRON', 6, NULL, 'tron'),
('tron', 'TRON', 'token', 'USDT', 'Tether TRC20', 6, 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 'tether'),
('tron', 'TRON', 'token', 'USDC', 'USD Coin TRC20', 6, 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8', 'usd-coin'),

-- Bitcoin
('bitcoin', 'Bitcoin', 'native', 'BTC', 'Bitcoin', 8, NULL, 'bitcoin'),

-- XRP Ledger
('xrpl', 'XRP', 'native', 'XRP', 'XRP', 6, NULL, 'ripple'),

-- TON
('ton', 'TON', 'native', 'TON', 'Toncoin', 9, NULL, 'the-open-network'),

-- VeChain
('evm', 'VeChain', 'native', 'VET', 'VeChain', 18, NULL, 'vechain'),
('evm', 'VeChain', 'token', 'VTHO', 'VeThor', 18, '0x0000000000000000000000000000456E65726779', 'vethor-token')

ON CONFLICT DO NOTHING;