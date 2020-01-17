const {
  timestamp,
  isPast,
  linkify,
  keyForValue,
  replaceUserNames
} = require("./helpers");

function renderTodo(todo, state) {
  let bodyText = replaceUserNames(todo.text, state.userIDs);
  if (/https\:\/\/(.*)\.slack\.com\/archives\//.test(todo.text)) {
    const [_, channelID] = todo.text.match(
      /\.slack\.com\/archives\/(.*)\/.*/,
      "g"
    );

    // console.log(channelID);

    let channelName = keyForValue(channelID, state.conversationIDs);
    if (
      !channelName &&
      Object.keys(state.conversationIDs).includes(channelID)
    ) {
      channelName = channelID;
    }

    bodyText = `Reminder`;
    if (todo.connectedUser) {
      bodyText += ` about ${todo.connectedUser}'s message`;
    }

    bodyText += ` in ${channelName || channelID}\n${linkify(todo.text)}`;
  }

  let todoClasses = ["todo"];
  let dueText = ``;
  if (todo.complete_ts > 0) {
    todoClasses.push("complete");
  } else if (isPast(todo.time * 1000)) {
    dueText = `<span class='due'>Overdue</span>`;
  }

  return `
    <li class='${todoClasses.join(" ")}'>
      <span class='text'>${bodyText}</span>
      ${
        todo.connectedText
          ? `<span class='connected'>${linkify(todo.connectedText)}</span>`
          : ``
      }
      <span class='mark-complete' onClick="markComplete('${
        todo.id
      }')">Mark Complete</span>
      <span class='timestamp'>Due ${timestamp(todo.time)}</span>
      ${dueText}
    </li>
  `;
}

module.exports = { renderTodo };
