const Store = require("electron-store");

// Persistence
const store = new Store({
  name: "slackminder",
  encryptionKey: "AHGp2DgwFZ"
});

// Snapshots can be debounced, which means if you call it in close
// succession it won't keep saving, but wait until you're done
let debouncer = null;
const saveSnapshot = (state, debounce = 0) => {
  // immediately
  if (debounce === 0) return store.set("TEMP_STATE", state);

  // debounced
  if (debouncer) clearTimeout(debouncer);
  debouncer = setTimeout(() => store.set("TEMP_STATE", state), debounce);
};
const retrieveSnapshot = () => store.get("TEMP_STATE");

module.exports = {
  saveSnapshot,
  retrieveSnapshot
};
