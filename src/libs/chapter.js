import { parseId } from "./utils"

export async function getNotesBlock(bookId) {
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
      parseId(bookId),
    )
  )[0]
  if (res == null) return null
  const ret = await logseq.Editor.getBlock(res[0].uuid, {
    includeChildren: true,
  })
  ret.bookId = bookId
  return ret
}

export async function createOrGetChapter(notesBlock, note) {
  if (notesBlock.children == null) {
    notesBlock.children = []
  }

  for (const block of notesBlock.children) {
    if (block.properties?.章节id === note.chapterUid) {
      return block
    }
  }

  const chapterName = note.chapterName ?? "未知"
  const content = `${chapterName}\nheading:: true\n章节id:: ${note.chapterUid}`
  const [refBlock, i] = await findChapterRefBlock(notesBlock, note.chapterUid)
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

export async function findNoteRefBlock(chapterBlock, noteStart) {
  for (let i = 0; i < chapterBlock.children.length; i++) {
    const noteBlock = chapterBlock.children[i]
    if (noteBlock.properties?.起始 > noteStart) {
      return [noteBlock, i]
    }
  }
  return []
}

async function findChapterRefBlock(notesBlocks, chapterUid) {
  for (let i = 0; i < notesBlocks.children.length; i++) {
    const chapterBlock = notesBlocks.children[i]
    if (chapterBlock?.properties?.章节id > chapterUid) {
      return [chapterBlock, i]
    }
  }
  return []
}
