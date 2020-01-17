const { format, isPast } = require("date-fns");
const linkifyUrls = require("linkify-urls");

// Helper functions
const delay = (d, fn) => setTimeout(fn, d);
const sortByDate = (a, b) => a.time - b.time;
const filterIncomplete = a => a.complete_ts === 0;
const filterNotMine = userId => a => a.user === userId;
const TIMESTAMP_FORMAT = "MMM Do, YYYY \\a\\t h:mmA";
const timestamp = a => format(a * 1000, TIMESTAMP_FORMAT);
const DATESTAMP_FORMAT = "MMM Do, YYYY";
const datestamp = a => format(a * 1000, DATESTAMP_FORMAT);

const extractPermalink = perma => {
  let num = null;
  let thread = null;
  const slug = perma.split(".slack.com/")[1];
  const [_, channel, rest] = slug.split("/");

  if (rest.includes("?")) {
    const [pnum, query] = rest.split("?");
    const [thread_ts, _] = query.split("&");
    num = pnum.replace("p", "");
    thread = thread_ts.replace("thread_ts=", "");
  } else {
    num = rest.replace("p", "");
  }

  return { channel, num, thread };
};

const matchPermalink = perma => {
  const reg = /https\:\/\/.*\.slack\.com\/archives\/([0-9a-zA-Z\-]*)\/p(\d*)/;
  const regThread = /https\:\/\/.*\.slack\.com\/archives\/([0-9a-zA-Z\-]*)\/p(\d*)\?thread_ts=(\d*)&cid=.*/;

  if (regThread.test(perma)) {
    return perma.match(regThread, "g");
  } else {
    return perma.match(reg, "g");
  }
};

window.extractPermalink = extractPermalink;

const slackLinkify = perma => {
  let link = event.target.href;

  // Rewrite Slack links to slack:// links
  if (perma.includes("slack.com/archives")) {
    const { channel, num, thread } = extractPermalink(perma);
    // prettier-ignore
    link = `slack://channel?team=${state.team.id}&id=${channel}&message=${num / 1000000}`
    if (thread) link += `&thread_ts=${thread / 1000000}`;
  }

  return link;
};

const linkify = t => {
  return linkifyUrls(t, {
    attributes: {
      // target: "externalframe"
    }
  });
};

const keyForValue = (val, obj) => {
  for (let key in obj) {
    if (obj[key] === val) return key;
  }
  return null;
};

const $id = id => document.getElementById(id);

function replaceUserNames(text, userIDLookup) {
  if (!text) return text;
  const userIDs = text
    .split("<@U")
    .slice(1)
    .map(t => "U" + t.split(">")[0]);

  userIDs.forEach(u => {
    text = text.replace(`<@${u}>`, `@${userIDLookup[u]}`);
  });

  return text;
}

module.exports = {
  sortByDate,
  filterIncomplete,
  filterNotMine,
  timestamp,
  datestamp,
  isPast,
  extractPermalink,
  matchPermalink,
  delay,
  linkify,
  slackLinkify,
  keyForValue,
  $id,
  replaceUserNames
};
