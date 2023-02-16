import "@logseq/libs"
import { setup } from "logseq-l10n"
import zhCN from "./translations/zh-CN.json"

async function main() {
  await setup({ builtinTranslations: { "zh-CN": zhCN } })

  // TODO: settings

  logseq.beforeunload(() => {})

  console.log("#weread-sync loaded")
}

const model = {
  receiveSyncData(data) {
    // TODO
    console.log(data)
  },
}

logseq.ready(model, main).catch(console.error)
