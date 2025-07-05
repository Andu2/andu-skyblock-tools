import { useContext } from "solid-js";
import { AppContext } from "./appContext";
import { formatNumber } from "./format";

export function Stats() {
  const { vm } = useContext(AppContext);
  return (
    <div>
      Cost to max everything: <span class="cost">{formatNumber(vm.stats.totalPriceToMax)}</span>
    </div>
  );
}
