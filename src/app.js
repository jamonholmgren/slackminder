const {
  sortByDate,
  filterIncomplete,
  filterNotMine,
  slackLinkify,
  $id
} = require("./helpers");
const {
  setSlackToken,
  completeTodo,
  preloadTeamInfo,
  preloadUserList,
  preloadChannelList,
  loadReminders,
  retrieveConnectedText
} = require("./api");
const { saveSnapshot, retrieveSnapshot } = require("./storage");
const { renderView } = require("./view");

// Open links in browser by default
const shell = require("electron").shell;
document.addEventListener("click", function(event) {
  if (event.target.tagName === "A" && event.target.href.startsWith("http")) {
    event.preventDefault();
    shell.openExternal(slackLinkify(event.target.href));
  }
});

// Function for setting initial state (or resetting state)
const initialState = () => ({
  refreshing: false,
  slackToken: null,
  authInfo: false,
  todos: [],
  team: null,
  conversationIDs: {},
  conversationsLoaded: false,
  userIDs: {},
  usersLoaded: false,
  theme: "dark"
});

// We keep one state object, mutate it, and manually tell the app to rerender
const state = initialState();
window.state = state; // for debugging

// Callback for side effects during state changes
function onStateChange(oldState, newState) {
  // if we're unsetting the slack token, unset the API client too
  if (newState.slackToken === null) slack = null;

  // if we're setting a new slack token, preload everything
  if (newState.slackToken && oldState.slackToken !== newState.slackToken) {
    preloadData(newState.slackToken).then(() => {});
  }
}

async function preloadData(slackToken) {
  const authInfo = await setSlackToken(slackToken);
  // { ok, team, team_id, url, user, user_id }
  if (!authInfo.ok || !authInfo.user_id) return setState({ slackToken: false });

  // Preload team, channel, and user info
  const [team, userIDs, conversationIDs] = await Promise.all([
    preloadTeamInfo(),
    preloadUserList(),
    preloadChannelList()
  ]);

  setState({
    authInfo,
    team,
    conversationIDs,
    conversationsLoaded: true,
    userIDs,
    usersLoaded: true
  });
}

// Jamon's "Poor Man's React" setState 😅
function setState(newState) {
  onStateChange(state, newState); // Side effects
  Object.assign(state, newState); // Shallow merge
  render(); // blow everything away and rerender
  saveSnapshot(state, 100); // debounce 100ms for performance
}

// All callbacks are hung on `window`
// It allows for `<span onClick="onClickMe">Click Me</span>`, etc

// Change the theme
window.toggleTheme = theme => setState({ theme });

// Log in by setting a new Slack API token
window.newSlackToken = () => {
  const token = $id("slackToken").value;
  setState({ slackToken: token });
};

// Log out by unsetting Slack API token and reset to initial state
window.resetSlackToken = () => {
  if (!window.confirm("Are you sure you want to log out?")) return;
  setState(initialState());
};

// Mark a reminder as "complete"
window.markComplete = id => {
  const todo = state.todos.find(todo => todo.id === id);
  completeTodo(todo).then(() => render());
};

// Refresh everything
window.refreshList = () => {
  setState({ refreshing: true });
  refreshTodoList().then(() => setState({ refreshing: false }));
};

async function refreshTodoList() {
  const reminders = await loadReminders();

  // Good to go! Set the todos and rerender
  setState({
    todos: reminders
      .sort(sortByDate)
      .filter(filterIncomplete)
      .filter(filterNotMine(state.authInfo.user_id))
  });

  // now go get any expanded data we need, like linked messages
  // but only first 25 for rate limiting reasons
  let delayedRate = 100;
  state.todos
    .filter(todo => todo.text.includes(".slack.com/archives"))
    .slice(0, 25) // Grab first 25 only
    .forEach(todo => {
      // avoid getting ratelimited...
      delayedRate += 100;
      setTimeout(() => retrieveConnectedText(todo).then(render), delayedRate);
    });
}

function render() {
  // Replace the root node contents
  $id("slackminder").innerHTML = renderView(state);
}

// Restore previous state and kick off the first render
const restoreState = retrieveSnapshot();
if (restoreState) {
  setState(restoreState);
} else {
  setState({ slackToken: null });
}
