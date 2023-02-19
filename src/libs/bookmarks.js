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
      [?t :db/id ?id]
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
    await createOrGetNote(chapterBlock, bookmark, bookmarkStart, bookmarkEnd)
  }
}

async function getNotesBlock(bookId) {
  const res = (
    await logseq.DB.datascriptQuery(
      `[:find (pull ?b [:block/uuid])
      :in $ ?bookId
      :where
      [?p :block/name]
      [?p :block/properties ?pprops]
      [(get ?pprops :书籍id) ?pv]
      [(= ?pv ?bookId)]
      [?b :block/page ?p]
      [?b :block/properties ?props]
      [(get ?props :部分) ?v]
      [(= ?v "笔记")]]`,
      `"${bookId}"`,
    )
  )[0]
  if (res == null) return null
  const ret = await logseq.Editor.getBlock(res[0].uuid, {
    includeChildren: true,
  })
  ret.bookId = bookId
  return ret
}

async function createOrGetChapter(
  notesBlock,
  bookmark,
  chapters,
  bookmarkStart,
) {
  if (notesBlock.children == null) {
    notesBlock.children = []
  }

  for (const block of notesBlock.children) {
    if (block.properties?.章节id === bookmark.chapterUid) {
      return block
    }
  }

  const chapterName =
    bookmark.chapterName ??
    chapters.find(
      (c) =>
        c.bookId === bookmark.bookId && c.chapterUid === bookmark.chapterUid,
    )?.title
  const content = `${chapterName}\nheading:: true\n章节id:: ${bookmark.chapterUid}`
  const [refBlock, i] = await findChapterRefBlock(notesBlock, bookmarkStart)
  if (refBlock) {
    const ret = await logseq.Editor.insertBlock(refBlock.uuid, content, {
      before: true,
      sibling: true,
    })
    notesBlock.children.splice(i, 0, ret)
    return ret
  } else {
    const ret = await logseq.Editor.insertBlock(notesBlock.uuid, content)
    notesBlock.children.push(ret)
    return ret
  }
}

async function findChapterRefBlock(notesBlocks, bookmarkStart) {
  for (let i = 0; i < notesBlocks.children.length; i++) {
    const chapterBlock = notesBlocks.children[i]
    const firstBlock = chapterBlock.children?.[0]
    if (firstBlock?.properties?.起始 > bookmarkStart) {
      return [chapterBlock, i]
    }
  }
  return []
}

async function createOrGetNote(
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

  const [refBlock, i] = await findBookmarkRefBlock(chapterBlock, bookmarkStart)
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

async function findBookmarkRefBlock(chapterBlock, bookmarkStart) {
  for (let i = 0; i < chapterBlock.children.length; i++) {
    const bookmarkBlock = chapterBlock.children[i]
    if (bookmarkBlock.properties?.起始 > bookmarkStart) {
      return [bookmarkBlock, i]
    }
  }
  return []
}
