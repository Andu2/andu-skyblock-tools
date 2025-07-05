/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import "./index.css";
import { ShardViewer } from "./ShardViewer.tsx";
import { Layout } from "./Layout.tsx";
import { About } from "./About.tsx";
import { getShardViewModel } from "./view.ts";
import { AppContext } from "./appContext.ts";
import { Stats } from "./Stats.tsx";

const root = document.getElementById("root");
const vm = getShardViewModel();

const shardIdFilter = {
  shardId: vm.shardIds,
};

render(
  () => (
    <AppContext.Provider value={{ vm: vm }}>
      <Router root={Layout}>
        <Route path="/about" component={About} />
        <Route path="/stats" component={Stats} />
        <Route path="/simulator" component={() => <div>Simulator</div>} />
        <Route path="/:shardId?" component={ShardViewer} matchFilters={shardIdFilter} />
        <Route path="*" component={() => <div>404 Not Found</div>} />
      </Router>
    </AppContext.Provider>
  ),
  root!
);
