import { A } from "@solidjs/router";
import type { JSXElement } from "solid-js";

export function Layout(props: { children?: JSXElement }) {
  return (
    <>
      <header>
        <h1>Skyblock Shard Viewer</h1>
        <A class="nav-link" href="/">
          Shards
        </A>
        <A class="nav-link" href="/stats">
          Stats
        </A>
        <A class="nav-link" href="/simulator">
          Simulator
        </A>
        <A class="nav-link" href="/about">
          About
        </A>
      </header>
      <div class="page-content">{props.children}</div>
    </>
  );
}
