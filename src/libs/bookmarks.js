import { createOrGetChapter, findNoteRefBlock, getNotesBlock } from "./chapter"
import { parseRange, toLSDateFromTS } from "./utils"

export async function syncBookmarks(bookmarks) {
  await syncRemoved(bookmarks.removed)
  await syncUpdated(bookmarks.updated)
}

async function syncRemoved(bookmarkIds) {
  for (const bookmarkId of bookmarkIds) {
    const blockRes = (
      await logseq.DB.datascriptQuery(
        `[:find (pull ?b [:db/id :block/uuid])
        :in $ ?id
        :where
        [?b :block/properties ?props]
        [(get ?props :划线id) ?v]
        [(= ?v ?id)]]`,
        `"${bookmarkId}"`,
      )
    )[0]
    if (blockRes == null) continue
    const block = blockRes[0]
    const referencedRes = await logseq.DB.datascriptQuery(
      `[:find (pull ?b [:db/id])
      :in $ ?id
      :where
      [?t]
      [(= ?t ?id)]
      [?b :block/refs ?t]]`,
      block.id,
    )
    if (referencedRes?.length > 0) {
      await logseq.Editor.upsertBlockProperty(block.uuid, "已被删除", "是")
    } else {
      await logseq.Editor.removeBlock(block.uuid)
    }
  }
}

async function syncUpdated(bookmarks) {
  let notesBlock = null
  let chapterBlock = null
  for (const bookmark of bookmarks) {
    // page bookmark is ignored.
    if (bookmark.type === 0) continue
    if (await hasBookmark(bookmark)) continue
    if (notesBlock?.bookId !== bookmark.bookId) {
      notesBlock = await getNotesBlock(bookmark.bookId)
      if (notesBlock == null) continue
      chapterBlock = null
    }
    if (chapterBlock?.properties?.章节id !== bookmark.chapterUid) {
      chapterBlock = await createOrGetChapter(notesBlock, bookmark)
    }
    await createOrGetBookmark(chapterBlock, bookmark)
  }
}

async function createOrGetBookmark(chapterBlock, bookmark) {
  if (chapterBlock.children == null) {
    chapterBlock.children = []
  }

  for (const block of chapterBlock.children) {
    if (block.properties?.划线id === bookmark.bookmarkId) {
      return block
    }
  }

  const [start, end] = parseRange(bookmark.range)
  const content = `${bookmark.markText}\n\n划线id:: ${
    bookmark.bookmarkId
  }\n创建日期:: ${toLSDateFromTS(
    bookmark.createTime,
  )}\n起始:: ${start}\n结束:: ${end ?? start}`

  const [refBlock, i] = await findNoteRefBlock(chapterBlock, start)
  if (refBlock) {
    const ret = await logseq.Editor.insertBlock(refBlock.uuid, content, {
      before: true,
      sibling: true,
    })
    chapterBlock.children.splice(i, 0, ret)
    return ret
  } else {
    const ret = await logseq.Editor.insertBlock(chapterBlock.uuid, content)
    chapterBlock.children.push(ret)
    return ret
  }
}

async function hasBookmark(bookmark) {
  const result = (
    await logseq.DB.datascriptQuery(
      `[:find (pull ?b [:db/id])
      :in $ ?bookId ?bookmarkId
      :where
      [?p :block/name]
      [?p :block/properties ?bookProps]
      [(get ?bookProps :书籍id) ?bookId]
      [?b :block/page ?p]
      [?b :block/properties ?props]
      [(get ?props :划线id) ?bookmarkId]]`,
      bookmark.bookId,
      `"${bookmark.bookmarkId}"`,
    )
  ).flat()
  return result.length > 0
}
