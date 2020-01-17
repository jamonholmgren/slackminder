const Slack = require("slack");
const { datestamp, matchPermalink, replaceUserNames } = require("./helpers");

let slack = null;

/**
 * Sets the Slack token and tries to connect.
 *
 * Return value is a promise that resolves to something like this:
 * { ok, team, team_id, url, user, user_id }
 */
async function setSlackToken(token) {
  slack = new Slack({ token });
  window.slack = slack; // for debugging in console
  return slack.auth.test();
}

async function completeTodo(todo) {
  const { ok } = await slack.reminders.complete({ reminder: todo.id });
  if (ok) todo.complete_ts = 1; // mark existing todo as complete
}

// Preloads Slack team info
async function preloadTeamInfo() {
  const { ok, team } = await slack.team.info();
  if (ok) return team;
}

// Preloads user names and IDs
async function preloadUserList() {
  const { ok, members } = await slack.users.list({ limit: 1000 });
  if (ok) {
    const userIDs = {};
    members.forEach(u => (userIDs[u.id] = u.name));
    return userIDs;
  }
}

// Preloads channel names and IDs
async function preloadChannelList() {
  const { ok, channels } = await slack.conversations.list({
    exclude_archived: true,
    limit: 1000,
    types: "public_channel,private_channel,mpim,im"
  });

  if (ok) {
    const conversationIDs = {};
    channels.forEach(c => (conversationIDs[c.name] = c.id));
    return conversationIDs;
  }
}

// Loads all reminders
async function loadReminders() {
  const { ok, reminders } = await slack.reminders.list();

  if (ok) {
    return reminders;
  } else {
    console.error(response);
  }
}

// Retrieve any connected (linked) messages in the todo
async function retrieveConnectedText(todo) {
  todo.channelID = null;
  todo.messageTS = null;
  todo.threadTS = null;
  todo.connectedText = null;
  todo.connectedUser = null;
  todo.connectedText = "Loading message...";

  // extract the URL
  const parts = matchPermalink(todo.text);
  todo.channelID = parts[1];

  // if it's a channel name, translate to channel ID
  if (state.conversationIDs[parts[1]]) {
    todo.channelID = state.conversationIDs[parts[1]];
  }

  // message timestamps need to be transformed from the parts 2 & 3
  // timestamps are 6 digits shorter than the permalink
  todo.messageTS = Math.floor(parts[2] / 1000000);
  todo.threadTS = Math.floor(parts[3] / 1000000);

  // get the message
  const { ok, messages } = await slack.conversations.history({
    channel: todo.channelID,
    count: 1,
    inclusive: true,
    latest: todo.messageTS + 1, // to get 1 message
    oldest: todo.messageTS
  });

  if (ok && messages[0]) {
    const msg = messages[0];
    todo.connectedUser = state.userIDs[msg.user] || msg.user;
    const dateStr = datestamp(parseInt(msg.ts));
    todo.connectedText =
      `<span class='byline'>${todo.connectedUser ||
        "An unknown user"} said on ${dateStr}:</span> ` +
      replaceUserNames(messages[0].text, state.userIDs);
  }
}

module.exports = {
  setSlackToken,
  completeTodo,
  preloadTeamInfo,
  preloadUserList,
  preloadChannelList,
  loadReminders,
  retrieveConnectedText
};
