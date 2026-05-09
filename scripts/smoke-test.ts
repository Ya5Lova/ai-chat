/**
 * Smoke test: ずんだもんエージェントがキャラクターとして応答するかを確認する
 * 実行: npx tsx scripts/smoke-test.ts
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ERROR: ANTHROPIC_API_KEY が .env.local に設定されていないのだ！");
  process.exit(1);
}

import { zundamonAgent } from "../lib/mastra/agent";

async function main() {
  console.log("ずんだもんエージェントのスモークテストを開始するのだ...\n");

  const response = await zundamonAgent.generate(
    "こんにちは！自己紹介してください。"
  );

  console.log("=== ずんだもんの応答 ===");
  console.log(response.text);
  console.log("=======================\n");

  const hasNoda = response.text.includes("のだ");
  const hasBoku = response.text.includes("ぼく");

  console.log(`✅ 語尾「〜のだ」を含む: ${hasNoda ? "OK" : "NG"}`);
  console.log(`✅ 一人称「ぼく」を含む: ${hasBoku ? "OK" : "NG"}`);

  if (!hasNoda || !hasBoku) {
    console.error("\n⚠️  キャラクターの応答に問題があるのだ。システムプロンプトを確認してください。");
    process.exit(1);
  }

  console.log("\n🟢 スモークテスト成功なのだ！");
}

main().catch((err) => {
  console.error("スモークテスト失敗なのだ:", err);
  process.exit(1);
});
