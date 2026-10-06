export const LAUNCH_FACTORY_ADDRESS =
  "0x533cE670f1372cb402D49866608b92e7bc2b4493" as const;

export const launchFactoryAbi = [
  {
    type: "function",
    name: "launchFee",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "TokenLaunched",
    inputs: [
      {
        name: "token",
        type: "address",
        indexed: true,
      },
      {
        name: "curve",
        type: "address",
        indexed: true,
      },
      {
        name: "deployer",
        type: "address",
        indexed: true,
      },
      {
        name: "pairToken",
        type: "address",
        indexed: false,
      },
      {
        name: "launchConfigId",
        type: "uint256",
        indexed: false,
      },
      {
        name: "graduationThreshold",
        type: "uint256",
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: "function",
    name: "getLaunchedToken",
    inputs: [
      {
        name: "token",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "token", type: "address" },
          { name: "curve", type: "address" },
          { name: "deployer", type: "address" },
          { name: "creatorFeeRecipient", type: "address" },
          { name: "pairToken", type: "address" },
          { name: "graduationThreshold", type: "uint256" },
          { name: "poolFee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "creatorTaxBps", type: "uint16" },
          { name: "buybackEnabled", type: "bool" },
          { name: "phase", type: "uint8" },
          { name: "sweptQuote", type: "uint256" },
          { name: "sweptTokens", type: "uint256" },
          { name: "sweptAt", type: "uint256" },
          { name: "exists", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
] as const;
