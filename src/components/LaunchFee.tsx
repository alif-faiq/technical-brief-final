import { useReadContract } from "wagmi";
import {
  LAUNCH_FACTORY_ADDRESS,
  launchFactoryAbi,
} from "../contracts/LaunchFactory";

export default function LaunchFee() {
  const { data, isLoading, isError } = useReadContract({
    address: LAUNCH_FACTORY_ADDRESS,
    abi: launchFactoryAbi,
    functionName: "launchFee",
  });

  if (isLoading) {
    return <p>Loading launch fee...</p>;
  }

  if (isError) {
    return <p>Failed to read launch fee.</p>;
  }

  return (
    <div>
      <h2>Launch Fee</h2>
      <p>{data?.toString()} wei</p>
    </div>
  );
}
