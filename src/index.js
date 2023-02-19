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

  // TODO: testing, remove later
  // const book = {
  //   bookId: "CB_664DDsDC3FZ96dr6cZBfJEHc",
  //   title: "发现商业模式(完整图文版) (新金融时代)",
  //   author: "魏炜 朱武祥",
  //   cover:
  //     "https://res.weread.qq.com/wrepub/CB_664DDsDC3FZ96dr6cZBfJEHc_parsecover",
  //   version: 1438912069,
  //   format: "epub",
  //   type: 0,
  //   price: 0,
  //   originalPrice: 0,
  //   soldout: 0,
  //   bookStatus: 1,
  //   payType: 33,
  //   centPrice: 0,
  //   finished: 1,
  //   maxFreeChapter: 0,
  //   free: 1,
  //   mcardDiscount: 0,
  //   ispub: 0,
  //   cpid: 0,
  //   publishTime: "",
  //   hasLecture: 0,
  //   lastChapterIdx: 17,
  //   paperBook: {
  //     skuId: "",
  //   },
  //   payingStatus: 0,
  //   chapterSize: 17,
  //   updateTime: 1673512602,
  //   unitPrice: 0,
  //   marketType: 0,
  //   isbn: "",
  //   publisher: "HZBCN",
  //   totalWords: 0,
  //   bookSize: 0,
  //   shouldHideTTS: 0,
  //   recommended: 0,
  //   lectureRecommended: 0,
  //   follow: 0,
  //   secret: 0,
  //   offline: 0,
  //   lectureOffline: 0,
  //   finishReading: 0,
  //   hideReview: 0,
  //   hideFriendMark: 0,
  //   blacked: 0,
  //   isAutoPay: 0,
  //   availables: 0,
  //   paid: 0,
  //   isChapterPaid: 0,
  //   showLectureButton: 1,
  //   wxtts: 1,
  //   ratingCount: 0,
  //   ratingDetail: {
  //     one: 0,
  //     two: 0,
  //     three: 0,
  //     four: 0,
  //     five: 0,
  //     recent: 0,
  //   },
  //   newRating: 0,
  //   newRatingCount: 0,
  //   newRatingDetail: {
  //     good: 0,
  //     fair: 0,
  //     poor: 0,
  //     recent: 0,
  //     myRating: "",
  //     title: "待评分",
  //   },
  //   ranklist: {},
  //   coverBoxInfo: {},
  // }
  // await syncBooks({
  //   removed: [],
  //   updated: [book],
  // })
  // const bookmarks = {
  //   updated: [
  //     // {
  //     //   bookId: "CB_664DDsDC3FZ96dr6cZBfJEHc",
  //     //   bookVersion: 1438912069,
  //     //   chapterUid: 1,
  //     //   markText: "我最赞同的答案就是：“利益相关者的交易结构”。",
  //     //   range: "790-813",
  //     //   style: 1,
  //     //   type: 1,
  //     //   createTime: 1673591380,
  //     //   bookmarkId: "CB_664DDsDC3FZ96dr6cZBfJEHc_1_790-813",
  //     // },
  //     // {
  //     //   bookId: "CB_664DDsDC3FZ96dr6cZBfJEHc",
  //     //   bookVersion: 1438912069,
  //     //   chapterUid: 1,
  //     //   markText:
  //     //     "创造商业模式，要思考三个问题：一是不断思考谁是你的“利益相关者”；二是要分析这些利益相关者“有什么价值可以交换”；三是要设计共赢的“交易结构”。",
  //     //   range: "1046-1118",
  //     //   style: 1,
  //     //   type: 1,
  //     //   createTime: 1673591300,
  //     //   bookmarkId: "CB_664DDsDC3FZ96dr6cZBfJEHc_1_1046-1118",
  //     // },
  //   ],
  //   removed: [],
  //   chapters: [
  //     {
  //       bookId: "CB_664DDsDC3FZ96dr6cZBfJEHc",
  //       chapterUid: 1,
  //       chapterIdx: 1,
  //       title: "推荐序",
  //     },
  //     {
  //       bookId: "43168709",
  //       chapterUid: 246,
  //       chapterIdx: 246,
  //       title: "37 为什么我们看不到月球的背面？",
  //     },
  //     {
  //       bookId: "3300033191",
  //       chapterUid: 4,
  //       chapterIdx: 4,
  //       title: "第1篇 这些潜意识行为，在阻止你获得你想要的生活",
  //     },
  //     {
  //       bookId: "CB_4Mc5AA5AK5Se6aq6cZ",
  //       chapterUid: 7,
  //       chapterIdx: 7,
  //       title: "第二章 第一个逆转患者",
  //     },
  //     {
  //       bookId: "CB_C5O7gs7haGYo6ZS6YQ",
  //       chapterUid: 17,
  //       chapterIdx: 17,
  //       title: "小结",
  //     },
  //     {
  //       bookId: "CB_C5O7gs7haGYo6ZS6YQ",
  //       chapterUid: 9,
  //       chapterIdx: 9,
  //       title: "小结",
  //     },
  //     {
  //       bookId: "34405202",
  //       chapterUid: 12,
  //       chapterIdx: 12,
  //       title: "9 宋朝人的雅文化 夜市是如何出现的？",
  //     },
  //     {
  //       bookId: "34405202",
  //       chapterUid: 7,
  //       chapterIdx: 7,
  //       title: "4 大一统的秦朝 爱鱼丸的秦始皇与营养不良的老百姓",
  //     },
  //     {
  //       bookId: "CB_C9VAQ9APFDl26Z66YQ",
  //       chapterUid: 6,
  //       chapterIdx: 6,
  //       title: "第2章 别给孩子的性格贴标签，所有问题都只是具体的行为问题",
  //     },
  //     {
  //       bookId: "CB_C9VAQ9APFDl26Z66YQ",
  //       chapterUid: 12,
  //       chapterIdx: 12,
  //       title: "孩子稍稍不合心意就乱发脾气？",
  //     },
  //     {
  //       bookId: "CB_C9VAQ9APFDl26Z66YQ",
  //       chapterUid: 4,
  //       chapterIdx: 4,
  //       title: "抓住“偶然”的机会，才能培养出“自觉主动型孩子”",
  //     },
  //     {
  //       bookId: "31839236",
  //       chapterUid: 5,
  //       chapterIdx: 5,
  //       title: "前言",
  //     },
  //     {
  //       bookId: "CB_C9VAQ9APFDl26Z66YQ",
  //       chapterUid: 2,
  //       chapterIdx: 2,
  //       title: "第1章 “不批评”才能帮孩子养成好习惯",
  //     },
  //     {
  //       bookId: "CB_C9VAQ9APFDl26Z66YQ",
  //       chapterUid: 9,
  //       chapterIdx: 9,
  //       title: "孩子爱使性子、说气话，一定要让他对所说的话负责",
  //     },
  //     {
  //       bookId: "CB_C9VAQ9APFDl26Z66YQ",
  //       chapterUid: 13,
  //       chapterIdx: 13,
  //       title: "父母的态度决定了孩子能否遵守约定",
  //     },
  //     {
  //       bookId: "CB_C9VAQ9APFDl26Z66YQ",
  //       chapterUid: 7,
  //       chapterIdx: 7,
  //       title: "你是否将所有问题都归咎于孩子的“性格”，对孩子只批评不表扬？",
  //     },
  //     {
  //       bookId: "CB_C5O7gs7haGYo6ZS6YQ",
  //       chapterUid: 8,
  //       chapterIdx: 8,
  //       title: "1.2.2 执行能力决定了战略选择的结果",
  //     },
  //     {
  //       bookId: "CB_C5O7gs7haGYo6ZS6YQ",
  //       chapterUid: 5,
  //       chapterIdx: 5,
  //       title: "1.1.2 制造业是一切企业的蓝本",
  //     },
  //     {
  //       bookId: "34405202",
  //       chapterUid: 6,
  //       chapterIdx: 6,
  //       title: "3 春秋战国 因吃而出现的命案为何如此之多？",
  //     },
  //     {
  //       bookId: "CB_C9VAQ9APFDl26Z66YQ",
  //       chapterUid: 14,
  //       chapterIdx: 14,
  //       title: "第4章 育儿构想越具体，越有利于培养出自觉主动的孩子",
  //     },
  //     {
  //       bookId: "CB_C9VAQ9APFDl26Z66YQ",
  //       chapterUid: 15,
  //       chapterIdx: 15,
  //       title: "让孩子充满干劲儿的秘诀:适当利用孩子喜欢的东西",
  //     },
  //     {
  //       bookId: "CB_C5O7gs7haGYo6ZS6YQ",
  //       chapterUid: 7,
  //       chapterIdx: 7,
  //       title: "1.2 日常业务背后的财务实质",
  //     },
  //     {
  //       bookId: "CB_C5O7gs7haGYo6ZS6YQ",
  //       chapterUid: 6,
  //       chapterIdx: 6,
  //       title: "1.1.3 企业经营三件事",
  //     },
  //   ],
  //   syncKey: 1676774388,
  // }
  // await syncBookmarks(bookmarks)

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
