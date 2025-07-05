export function shardImgPath(shardId: string): string {
  return `/img/shard_${shardId}.png`;
}

export function shardSmallImgPath(shardId: string): string {
  return `/img/shard_${shardId}_small.png`;
}

export function getCoinStack(price: number): string {
  if (price < 30_000) {
    return "/img/coins1.png";
  } else if (price < 100_000) {
    return "/img/coins2.png";
  } else if (price < 300_000) {
    return "/img/coins3.png";
  } else if (price < 1_000_000) {
    return "/img/coins4.png";
  } else if (price < 3_000_000) {
    return "/img/coins5.png";
  } else {
    return "/img/coins6.png";
  }
}
