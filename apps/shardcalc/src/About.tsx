export function About() {
  return (
    <div id="about">
      <h2>About</h2>
      <p>
        The primary purpose of this tool is to find which shard combinations are most efficient for making a specific
        shard. The secondary purpose of this tool is to act as a general reference for shard data.
      </p>
      <p>
        Skyblock Shard Browser was made by{" "}
        <a class="text-link" href="https://github.com/andu2" target="_blank" rel="noopener noreferrer">
          Andu
        </a>
        . If you notice any incorrect shard fusions, please{" "}
        <a
          class="text-link"
          href="https://github.com/andu2/andu-skyblock-tools/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          {" "}
          create an issue on GitHub
        </a>{" "}
        and give an example fusion with the corrected output. You may also{" "}
        <a class="text-link" href="https://ko-fi.com/andu_" target="_blank" rel="noopener noreferrer">
          Support me on Ko-fi
        </a>
      </p>
      <h3>Shard Fusion Mechanics</h3>
      <p>
        There are three different types of shard fusion: <strong>Basic</strong>, <strong>Special</strong>, and{" "}
        <strong>Chameleon</strong>.
      </p>
      <h4>Basic Fusion</h4>
      <p>
        Shards can be combined with any other shard to create the next highest numbered shard of the same rarity and
        category that is not excluded from being a basic fuse target. Shards that are fusion-only or are bought in shops
        are typically not valid basic fuse targets. If two shards of the same category are fused together, the shard
        with higher rarity will take priority. If the shards have the same rarity, shard 2 will take priority. For this
        reason, basic fusion is not fully commutative and swapping shards will sometimes produce different results.
        Example:
      </p>
      <h4>Special Fusion</h4>
      <p>
        Some shards have special rules that determine which shards can be used to create them. Typically these fusions
        will create 2 of the result although not all the time.
      </p>
      <h4>Chameleon Fusion</h4>
      <p>
        Chameleon shards can be fused with any other shard to create the numerically next three shards of the same
        rarity. If a number is missing, the fusion will produce the next rarity up, starting with number 1.
      </p>
      <h4>Fusion priority</h4>
      <p>
        A shard combination can only produce three shards as options, so some shards that meet the fusion requirements
        will be cut off. Chameleon fusions are highest priority, then basic fusion, then special fusion. Within special
        fusions, higher rarity results are higher priority, then lower numbered results.
      </p>
      <p>
        Credit goes to{" "}
        <a
          class="text-link"
          href="https://docs.google.com/spreadsheets/d/1ZY-nG60U7amPfqEcKnP5qkcK2JKrzpTyX8NkpPlYwZU/edit?gid=1207853378#gid=1207853378"
        >
          Georik's spreadsheet
        </a>{" "}
        for helping figure this stuff out.
      </p>
    </div>
  );
}
