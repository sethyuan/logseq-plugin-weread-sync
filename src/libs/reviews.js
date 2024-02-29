import { createOrGetChapter, findNoteRefBlock, getNotesBlock } from "./chapter"
import { parseId, parseRange, toLSDateFromTS } from "./utils"

export async function syncReviews(reviews) {
  await syncRemoved(reviews.removed)
  await syncUpdated(reviews.updated)
}

async function syncRemoved(reviewIds) {
  for (const reviewId of reviewIds) {
    const blockRes = (
      await logseq.DB.datascriptQuery(
        `[:find (pull ?b [:db/id :block/uuid])
        :in $ ?id
        :where
        [?b :block/properties ?props]
        [(get ?props :想法id) ?v]
        [(= ?v ?id)]]`,
        parseId(reviewId),
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

async function syncUpdated(reviews) {
  let notesBlock = null
  let chapterBlock = null
  for (const review of reviews) {
    if (review.chapterUid == null) continue
    if (await hasReview(review)) continue
    if (notesBlock?.bookId !== review.bookId) {
      notesBlock = await getNotesBlock(review.bookId)
      if (notesBlock == null) continue
      chapterBlock = null
    }
    if (chapterBlock?.properties?.章节id !== review.chapterUid) {
      chapterBlock = await createOrGetChapter(notesBlock, review)
    }
    await createOrGetReview(chapterBlock, review)
  }
}

async function createOrGetReview(chapterBlock, review) {
  if (chapterBlock.children == null) {
    chapterBlock.children = []
  }

  for (const block of chapterBlock.children) {
    if (block.properties?.想法id === review.reviewId) {
      return block
    }
  }

  const alternateStyle = logseq.settings?.alternateReviewStyle ?? false
  const [start, end] = parseRange(review.range)
  const content = `${alternateStyle ? review.abstract : review.content}\n> ${
    alternateStyle ? review.content : review.abstract
  }\n\n想法id:: ${review.reviewId}\n创建日期:: ${toLSDateFromTS(
    review.createTime,
  )}\n起始:: ${start}\n结束:: ${end}`

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

async function hasReview(review) {
  const result = (
    await logseq.DB.datascriptQuery(
      `[:find (pull ?b [:db/id])
      :in $ ?bookId ?reviewId
      :where
      [?p :block/name]
      [?p :block/properties ?bookProps]
      [(get ?bookProps :书籍id) ?bookId]
      [?b :block/page ?p]
      [?b :block/properties ?props]
      [(get ?props :想法id) ?reviewId]]`,
      review.bookId,
      `"${review.reviewId}"`,
    )
  ).flat()
  return result.length > 0
}
