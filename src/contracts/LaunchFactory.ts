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
] as const;
