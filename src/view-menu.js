function renderSlackTokenInput() {
  return `
    <div id='slack-token'>
      <p>To log in, go <a href='https://api.slack.com/custom-integrations/legacy-tokens'>here</a> and create a token.</p>
      <input id='slackToken' type='text' value='' placeholder='Slack Token' />
      <button type='button' onClick='newSlackToken()'>Log In</button>
    </div>
  `;
}

function renderLogout() {
  return `
    <button type='button' onClick='resetSlackToken()'>X Log Out</button>
  `;
}

function renderTodoRefresh() {
  return `<button type='button' onClick='refreshList()'>🔄 Refresh Todos</button>`;
}

function renderTheme(state) {
  if (state.theme === "light") {
    document.body.classList.add("light");
    document.body.classList.remove("dark");
    return `<button type='button' onClick="toggleTheme('dark')">🖥 Switch to Dark Mode</button>`;
  } else {
    document.body.classList.add("dark");
    document.body.classList.remove("light");
    return `<button type='button' onClick="toggleTheme('light')">🖥 Switch to Light Mode</button>`;
  }
}

function renderMenu(state) {
  if (!state.slackToken) return renderSlackTokenInput();

  if (!state.conversationsLoaded) {
    return `<p class='alert'>Loading channel data...</p>`;
  }

  return `
    <div class='menu'>
      ${renderTheme(state)}
      ${renderTodoRefresh()}
      ${renderLogout()}
    </div>
  `;
}

module.exports = {
  renderMenu
};
