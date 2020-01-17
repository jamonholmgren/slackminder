const { renderTodo } = require("./view-todo");

function renderTodos(state) {
  return `
    <ul>
      ${state.todos.map(todo => renderTodo(todo, state)).join("")}
    </ul>
  `;
}

module.exports = {
  renderTodos
};
