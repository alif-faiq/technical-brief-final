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
    return (
      <div className="launch-fee-card">
        <span className="eyebrow">LAUNCH FEE</span>
        <p>Loading fee...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="launch-fee-card launch-fee-error">
        <span className="eyebrow">LAUNCH FEE</span>
        <p>Unable to read fee</p>
      </div>
    );
  }

  return (
    <div className="launch-fee-card">
      <span className="eyebrow">LAUNCH FEE</span>
      <p className="launch-fee-value">{data?.toString() ?? '—'} <span>wei</span></p>
    </div>
  );
}
