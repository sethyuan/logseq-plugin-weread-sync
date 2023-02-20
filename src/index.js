import "@logseq/libs"
import { syncBooks } from "./libs/book"
import { syncBookmarks } from "./libs/bookmarks"
import { syncReviews } from "./libs/reviews"
import { setDateFormat } from "./libs/utils"

async function main() {
  const { preferredDateFormat } = await logseq.App.getUserConfigs()
  setDateFormat(preferredDateFormat)

  logseq.useSettingsSchema([
    {
      key: "tags",
      type: "string",
      default: "书",
      description: "同步时会在书籍页面上添加的标签。以逗号分隔。",
    },
    {
      key: "introBlock",
      type: "string",
      default: "[[简介]]",
      description: "同步时会在该内容块下输出书籍的简介。",
    },
    {
      key: "notesBlock",
      type: "string",
      default: "[[笔记]]",
      description: "同步时会在该内容块下输出笔记。",
    },
  ])

  console.log("#weread-sync loaded")
}

const model = {
  async receiveSyncData(data) {
    console.log("received sync data:", data)
    try {
      await syncBooks(data.books)
      await syncBookmarks(data.bookmarks)
      await syncReviews(data.reviews)
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  },
}

logseq.ready(model, main).catch(console.error)
