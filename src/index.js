import "@logseq/libs"

async function main() {
  logseq.useSettingsSchema([
    {
      key: "notesBlock",
      type: "string",
      default: "[[笔记]]",
      description: "同步时会在该内容块下输出笔记。",
    },
  ])

  logseq.beforeunload(() => {})

  console.log("#weread-sync loaded")
}

const model = {
  receiveSyncData(data) {
    // TODO
    console.log(data)
    return true
  },
}

logseq.ready(model, main).catch(console.error)
