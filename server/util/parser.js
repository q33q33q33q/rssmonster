const FeedParser = require("feedparser");
const got = require("got");
const he = require("he");

exports.process = async function(feedUrl) {
  const stream = await ReadFeed(feedUrl)
  const posts = await ReadFeedStream(stream, feedUrl)
  const response = await ParseFeedPost(posts)
  return response
}

function validateUrl(value) {
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}

async function ReadFeed (url) {
  try {
    if (validateUrl(url)) {
      const response = await got.stream(url, { retries: 0 })
      return response
    }
  } catch(err) {
    console.log(err);
  }
}

async function ReadFeedStream (stream, feedUrl) {
  const feed = {
    meta: '',
    posts: []
  }
  return new Promise((resolve, reject) => {
    stream.pipe(new FeedParser())
      .on('error', reject)
      .on('end', () => {
        resolve(feed)
      })
      .on('readable', function () {
        const streamFeed = this
        feed.meta = {
          link: this.meta.link,
          xmlurl: this.meta.xmlurl ? this.meta.xmlurl : feedUrl,
          favicon: this.meta.favicon,
          description: this.meta.description,
          title: this.meta.title
        }
        let item
        while ((item = streamFeed.read())) {
          feed.posts.push(item)
        }
      })
  })
}

function ParseFeedPost (feed) {
  feed.posts.map((item) => {
    item.favourite = false
    item.read = false
    item.offline = false
    if (item.summary) {
      item.summary = he.unescape(item.summary)
    }
    return item
  })
  return feed
}