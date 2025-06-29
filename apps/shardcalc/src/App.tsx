import { createSignal } from 'solid-js'
import { initShardFuseCalc } from './calc'
import type { Shard, ValuatedFuseResult } from './calc'

type ShardView = Partial<Shard>

function App() {
  const Calc = initShardFuseCalc();
  const shardIds = Calc.getShardIds();

  const [selectedShard, setSelectedShard] = createSignal("");
  const [shardData, setShardData] = createSignal<ShardView>({});
  const [fuseCombinations, setFuseCombinations] = createSignal<ValuatedFuseResult[]>([]);
  const [sourcesText, setSourcesText] = createSignal("");

  function processSelectedShard(shardId: string) {
    setSelectedShard(shardId);
    if (shardId) {
      const shard = Calc.getShard(shardId);
      setShardData(shard);
      window.shard = shard; // For debugging purposes
      setFuseCombinations(Calc.getFuseOptions(shardId));
      if (shard.sources && shard.sources.length > 0) {
        setSourcesText(`Sources: ${shard.sources.join(', ')}`);
      } else{
        setSourcesText("FUSION ONLY");
      }
    } else {
      setShardData({});
      setFuseCombinations([]);
      setSourcesText("");
    }
  }

  return (
    <>
      <select onchange={(e) => processSelectedShard(e.currentTarget.value)}>
        <option value="">Select a shard</option>
        {shardIds.map((id) => (
          <option value={id}>{id}</option>
        ))}
      </select>
      <h2>{selectedShard()}</h2>
      <div>
        <h3>{shardData().name} Shard</h3>
        <h4>{shardData().attributeName}</h4>
        <p>
          {sourcesText()}
        </p>
        <p>
          {JSON.stringify(shardData().specialFuses, null, 2)}
        </p>
      </div>
      <h2>Combinations:</h2>
      <table>
        <thead>
          <tr>
            <th>Shard1</th>
            <th>Shard2</th>
            <th>Cost per Shard</th>
            <th>Swappable</th>
          </tr>
        </thead>
        <tbody>
          {fuseCombinations().map((combination) => (
            <tr>
              <td>{combination.shard1} - {combination.shard1Name}</td>
              <td>{combination.shard2} - {combination.shard2Name}</td>
              <td>{combination.bazaarPricePerShard}</td>
              <td>{combination.swappable ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

export default App
