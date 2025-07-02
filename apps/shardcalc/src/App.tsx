import { createSignal } from 'solid-js'
import { getShardViewModel } from './view'
import { ShardSelect } from './ShardSelect'
import { ShardDetails } from './ShardDetails'
import { historyControls } from './history'
import type { ShardView } from './view'
import "./App.css"

function App() {
  const vm = getShardViewModel();

  const [selectedShard, setSelectedShard] = createSignal("");
  const [shardData, setShardData] = createSignal<ShardView | null>(null);

  function selectShard(shardId: string) {
    setSelectedShard(shardId);
    setShardData(vm.getShard(shardId));
  }

  const history = historyControls({
    selectedShard: selectedShard(),
    selectShard
  });

  return (
    <div id="app">
      <ShardSelect 
        vm={vm}
        selectedShard={selectedShard()}
        history={history}
      />
      { shardData() && (
        <ShardDetails 
          shard={shardData()!} 
          history={history}
        />
      )}
    </div>
  )
}

export default App
