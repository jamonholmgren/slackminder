const { renderTodos } = require("./view-todos");
const { renderMenu } = require("./view-menu");

function renderView(state) {
  const todoCount = state.todos.length;
  const incompleteTodoCount = state.todos.filter(t => t.complete_ts === 0)
    .length;
  return `
    ${renderMenu(state)}
    <p class="todo-count">${incompleteTodoCount}/${todoCount} todos</p>
    ${renderTodos(state)}
  `;
}

module.exports = { renderView };
