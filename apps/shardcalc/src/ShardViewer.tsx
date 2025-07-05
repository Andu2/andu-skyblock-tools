import { useContext } from "solid-js";
import { useParams } from "@solidjs/router";
import { ShardSelect } from "./ShardSelect";
import { ShardDetails } from "./ShardDetails";
import { AppContext } from "./appContext";

export function ShardViewer() {
  const { vm } = useContext(AppContext);

  const params = useParams<{ shardId?: string }>();
  const shardData = () => {
    if (!params.shardId) {
      return null;
    }
    return vm.getShard(params.shardId);
  };

  return (
    <>
      <div id="app">
        <div class="left-pane">
          <ShardSelect />
        </div>
        <div class="right-pane">
          {shardData() ? <ShardDetails shard={shardData()!} /> : <div>No shard selected</div>}
        </div>
      </div>
    </>
  );
}
