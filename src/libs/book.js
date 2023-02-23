import {
  chooseValue,
  parseId,
  tagListFromCategories,
  toLSDate,
  toTag,
  toTagList,
  trimAuthor,
} from "./utils"

const METADATA_KEYS = new Set([
  "tags",
  "分类",
  "作者",
  "译者",
  "出版社",
  "出版日期",
  "isbn",
  "已读完",
  "来源",
  "书籍id",
  "版本",
  "封面",
])

export async function syncBooks(books) {
  await syncRemoved(books.removed)
  await syncUpdated(books.updated)
}

async function syncRemoved(bookIds) {
  await Promise.all(
    bookIds.map(async (bookId) => {
      const res = (
        await logseq.DB.datascriptQuery(
          `[:find (pull ?p [:db/id :block/name])
        :in $ ?bookId
        :where
        [?p :block/name]
        [?p :block/properties ?props]
        [(get ?props :书籍id) ?v]
        [(= ?v ?bookId)]]`,
          parseId(bookId),
        )
      )[0]
      if (res == null) return
      const page = res[0]
      const referencedRes = (
        await logseq.DB.datascriptQuery(
          `[:find (pull ?b [:db/id]) (pull ?m [*])
        :in $ ?id
        :where
        [?book]
        [(= ?book ?id)]
        [?m :block/page ?book]
        [?m :block/pre-block? true]
        [?bb :block/page ?book]
        [?b :block/refs ?bb]]`,
          page.id,
        )
      )[0]
      if (referencedRes != null) {
        const metadata = referencedRes[1]
        if (!metadata.properties.已被删除) {
          await logseq.Editor.updateBlock(
            metadata.uuid,
            `${metadata.content}\n已被删除:: 是`,
          )
        }
      } else {
        await logseq.Editor.deletePage(page.name)
      }
    }),
  )
}

async function syncUpdated(books) {
  await Promise.all(
    books.map(async (book) => {
      const bookPage = await createOrGetBook(book.bookId, book.title)
      const bookBlocks = await logseq.Editor.getPageBlocksTree(bookPage.name)
      await writeMetadata(bookBlocks, book)
      await writeNotesSection(bookBlocks)
      await writeIntro(bookBlocks, book)
    }),
  )
}

async function createOrGetBook(bookId, title) {
  const res = (
    await logseq.DB.datascriptQuery(
      `[:find (pull ?p [*])
      :in $ ?bookId
      :where
      [?p :block/name]
      [?p :block/properties ?props]
      [(get ?props :书籍id) ?v]
      [(= ?v ?bookId)]]`,
      parseId(bookId),
    )
  )[0]

  if (res == null) {
    const page = await logseq.Editor.createPage(
      title,
      {},
      {
        createFirstBlock: true,
        format: "markdown",
        journal: false,
        redirect: false,
      },
    )
    return page
  } else {
    return res[0]
  }
}

async function writeMetadata(bookBlocks, book) {
  const metadataBlock = bookBlocks[0]
  const props = [
    `tags:: ${
      metadataBlock.propertiesTextValues?.tags || logseq.settings?.tags || ""
    }`,
    `分类:: ${chooseValue(
      tagListFromCategories(book.categories),
      metadataBlock.propertiesTextValues?.分类,
    )}`,
    `作者:: ${chooseValue(
      toTagList(trimAuthor(book.author)),
      metadataBlock.propertiesTextValues?.作者,
    )}`,
    ...(book.translator
      ? [
          `译者:: ${chooseValue(
            toTagList(trimAuthor(book.translator)),
            metadataBlock.propertiesTextValues?.译者,
          )}`,
        ]
      : []),
    `出版社:: ${chooseValue(
      toTag(book.publisher),
      metadataBlock.propertiesTextValues?.出版社,
    )}`,
    `出版日期:: ${chooseValue(
      toLSDate(book.publishTime),
      metadataBlock.propertiesTextValues?.出版日期,
    )}`,
    ...(book.isbn
      ? [
          `ISBN:: ${chooseValue(
            book.isbn,
            metadataBlock.propertiesTextValues?.isbn,
          )}`,
        ]
      : []),
    `已读完:: ${book.finishReading ? "是" : "否"}`,
    `来源:: [[微信读书]]`,
    `书籍id:: ${book.bookId}`,
    `版本:: ${book.version}`,
    ...(book.cover ? [`封面:: ![](${book.cover}){:width 80}`] : []),
  ].concat(
    Object.entries(metadataBlock.propertiesTextValues ?? {})
      .filter(([k]) => !METADATA_KEYS.has(k))
      .map(([k, v]) => `${k}:: ${v}`),
  )
  await logseq.Editor.updateBlock(metadataBlock.uuid, props.join("\n"))
}

async function writeNotesSection(bookBlocks) {
  const notesBlock = bookBlocks.find((b) => b.properties?.部分 === "笔记")
  if (notesBlock != null) return
  const metadataBlock = bookBlocks[0]
  await logseq.Editor.insertBlock(
    metadataBlock.uuid,
    `${logseq.settings?.notesBlock ?? "[[笔记]]"}\nheading:: true\n部分:: 笔记`,
    { sibling: true },
  )
}

async function writeIntro(bookBlocks, book) {
  if (!book.intro) return
  let introBlock = bookBlocks.find((b) => b.properties?.部分 === "简介")
  if (introBlock == null) {
    const metadataBlock = bookBlocks[0]
    introBlock = await logseq.Editor.insertBlock(
      metadataBlock.uuid,
      `${
        logseq.settings?.introBlock ?? "[[简介]]"
      }\nheading:: true\n部分:: 简介`,
      { sibling: true },
    )
    await logseq.Editor.insertBlock(introBlock.uuid, book.intro)
  } else {
    if (introBlock.children.length === 0) {
      await logseq.Editor.insertBlock(introBlock.uuid, book.intro)
    } else {
      const contentBlockUUID = introBlock.children[0].uuid
      await logseq.Editor.updateBlock(contentBlockUUID, book.intro)
    }
  }
}
