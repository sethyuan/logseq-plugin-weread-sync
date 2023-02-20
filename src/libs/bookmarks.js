import { createOrGetChapter, findNoteRefBlock, getNotesBlock } from "./chapter"
import { parseRange, toLSDateFromTS } from "./utils"

export async function syncBookmarks(bookmarks) {
  await syncRemoved(bookmarks.removed)
  await syncUpdated(bookmarks.updated, bookmarks.chapters)
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

async function syncUpdated(bookmarks, chapters) {
  let notesBlock = null
  let chapterBlock = null
  for (const bookmark of bookmarks) {
    if (notesBlock?.bookId !== bookmark.bookId) {
      notesBlock = await getNotesBlock(bookmark.bookId)
      if (notesBlock == null) continue
    }
    const [bookmarkStart, bookmarkEnd] = parseRange(bookmark.range)
    if (chapterBlock?.properties?.章节id !== bookmark.chapterUid) {
      chapterBlock = await createOrGetChapter(
        notesBlock,
        bookmark,
        chapters,
        bookmarkStart,
      )
    }
    await createOrGetBookmark(
      chapterBlock,
      bookmark,
      bookmarkStart,
      bookmarkEnd,
    )
  }
}

async function createOrGetBookmark(
  chapterBlock,
  bookmark,
  bookmarkStart,
  bookmarkEnd,
) {
  if (chapterBlock.children == null) {
    chapterBlock.children = []
  }

  for (const block of chapterBlock.children) {
    if (block.properties?.划线id === bookmark.bookmarkId) {
      return block
    }
  }

  const content = `${bookmark.markText}\n划线id:: ${
    bookmark.bookmarkId
  }\n创建日期:: ${toLSDateFromTS(
    bookmark.createTime,
  )}\n起始:: ${bookmarkStart}\n结束:: ${bookmarkEnd}`

  const [refBlock, i] = await findNoteRefBlock(chapterBlock, bookmarkStart)
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
