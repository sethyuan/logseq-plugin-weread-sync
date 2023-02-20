import { createOrGetChapter, findNoteRefBlock, getNotesBlock } from "./chapter"
import { parseRange, toLSDateFromTS } from "./utils"

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
        `"${reviewId}"`,
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
  for (const item of reviews) {
    const review = item.review
    if (notesBlock?.bookId !== review.bookId) {
      notesBlock = await getNotesBlock(review.bookId)
      if (notesBlock == null) continue
    }
    const [reviewStart, reviewEnd] = parseRange(review.range)
    if (chapterBlock?.properties?.章节id !== review.chapterUid) {
      chapterBlock = await createOrGetChapter(
        notesBlock,
        review,
        [],
        reviewStart,
      )
    }
    await createOrGetReview(chapterBlock, review, reviewStart, reviewEnd)
  }
}

async function createOrGetReview(chapterBlock, review, reviewStart, reviewEnd) {
  if (chapterBlock.children == null) {
    chapterBlock.children = []
  }

  for (const block of chapterBlock.children) {
    if (block.properties?.想法id === review.reviewId) {
      return block
    }
  }

  const content = `${review.content}\n> ${review.abstract}\n\n想法id:: ${
    review.reviewId
  }\n创建日期:: ${toLSDateFromTS(
    review.createTime,
  )}\n起始:: ${reviewStart}\n结束:: ${reviewEnd}`

  const [refBlock, i] = await findNoteRefBlock(chapterBlock, reviewStart)
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
