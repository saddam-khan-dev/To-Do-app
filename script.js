// Select DOM elements
const cardContainer = document.getElementById("card-container");
const todoForm = document.getElementById("todoForm");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const suggestionBox = document.getElementById("suggestion-box");
const exportBtn = document.getElementById("btn-export");
const pagination = document.getElementById("pagination");
const paginationWrapper = document.getElementById("pagination-wrapper");

const TODOS_PER_PAGE = 3;
let currentPage = 1;
let filteredTodos = [];

function highlightMatch(text, term) {
  const regex = new RegExp(`(${term})`, "gi");
  return text.replace(regex, '<span class="highlight">$1</span>');
}

function renderPagination(totalPages) {
  pagination.innerHTML = "";
  paginationWrapper.style.display = totalPages > 1 ? "block" : "none";

  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === currentPage ? "active" : ""}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.addEventListener("click", () => {
      currentPage = i;
      loadTodos(searchInput.value.trim());
    });
    pagination.appendChild(li);
  }
}

function loadTodos(filter = "") {
  cardContainer.innerHTML = "";
  const todos = JSON.parse(localStorage.getItem("todos")) || [];
  filteredTodos = filter
    ? todos.filter(t => t.title.toLowerCase().includes(filter.toLowerCase()))
    : todos;

  const totalPages = Math.ceil(filteredTodos.length / TODOS_PER_PAGE);
  renderPagination(totalPages);

  const start = (currentPage - 1) * TODOS_PER_PAGE;
  const pageTodos = filteredTodos.slice(start, start + TODOS_PER_PAGE);

  cardContainer.style.display = pageTodos.length ? "flex" : "none";

  pageTodos.forEach((todo, index) =>
    createCard(todo.title, todo.text, todo.timestamp, start + index, filter, todo.done)
  );
}

function createCard(title, text, timestamp, index, search = "", done = false) {
  const col = document.createElement("div");
  col.className = "col";

  const displayTitle = search ? highlightMatch(title, search) : title;
  const displayText = search ? highlightMatch(text, search) : text;

  col.innerHTML = `
    <div class="card w-100 h-100 d-flex flex-column justify-content-between">
      <div class="card-body d-flex flex-column">
        <div>
          <h5 class="card-title">${displayTitle}</h5>
          <p class="card-text">${displayText}</p>
          <p class="text-muted small">${timestamp}</p>
        </div>
        <div class="mt-auto pt-3 d-flex justify-content-between">
          <a href="#" class="btn btn-success btn-sm btn-done"><i class="bi bi-check-circle"></i> Done</a>
          <a href="#" class="btn btn-warning btn-sm btn-edit"><i class="bi bi-pencil-square"></i> Edit</a>
          <a href="#" class="btn btn-danger btn-sm btn-delete"><i class="bi bi-trash"></i> Delete</a>
        </div>
      </div>
    </div>`;

  const cardBody = col.querySelector(".card-body");

  if (done) {
    const doneBg = getComputedStyle(document.body).getPropertyValue('--done-bg').trim();
    cardBody.style.backgroundColor = doneBg;
    cardBody.style.textDecoration = "line-through";
  }

  col.querySelector(".btn-done").addEventListener("click", e => {
    e.preventDefault();
    toggleDone(index);
    loadTodos(searchInput.value.trim());
  });

  col.querySelector(".btn-edit").addEventListener("click", e => {
    e.preventDefault();
    const newTitle = prompt("Edit Title", title);
    const newText = prompt("Edit Description", text);
    if (newTitle && newText) {
      updateTodo(index, newTitle, newText);
      loadTodos(searchInput.value.trim());
    }
  });

  col.querySelector(".btn-delete").addEventListener("click", e => {
    e.preventDefault();
    deleteTodo(index);
  });

  cardContainer.appendChild(col);
}

function saveTodoToLocal(title, text) {
  const todos = JSON.parse(localStorage.getItem("todos")) || [];
  const timestamp = new Date().toLocaleString();
  todos.push({ title, text, timestamp, done: false });
  localStorage.setItem("todos", JSON.stringify(todos));
}

function updateTodo(index, newTitle, newText) {
  const todos = JSON.parse(localStorage.getItem("todos"));
  todos[index] = { ...todos[index], title: newTitle, text: newText };
  localStorage.setItem("todos", JSON.stringify(todos));
}

function toggleDone(index) {
  const todos = JSON.parse(localStorage.getItem("todos"));
  todos[index].done = !todos[index].done;
  localStorage.setItem("todos", JSON.stringify(todos));
}

function deleteTodo(index) {
  const todos = JSON.parse(localStorage.getItem("todos"));
  todos.splice(index, 1);
  localStorage.setItem("todos", JSON.stringify(todos));
  loadTodos(searchInput.value.trim());
}

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();
  const todos = JSON.parse(localStorage.getItem("todos")) || [];
  const matches = todos.filter(t => t.title.toLowerCase().includes(query.toLowerCase()));

  suggestionBox.innerHTML = "";
  if (query && matches.length) {
    suggestionBox.classList.remove("d-none");
    matches.slice(0, 5).forEach(m => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.innerHTML = highlightMatch(m.title, query);
      div.addEventListener("click", () => {
        searchInput.value = m.title;
        suggestionBox.classList.add("d-none");
        currentPage = 1;
        loadTodos(m.title);
      });
      suggestionBox.appendChild(div);
    });
  } else {
    suggestionBox.classList.add("d-none");
  }
});

todoForm.addEventListener("submit", e => {
  e.preventDefault();
  const title = modalTitle.value.trim();
  const text = modalText.value.trim();
  if (title && text) {
    saveTodoToLocal(title, text);
    modalTitle.value = "";
    modalText.value = "";
    bootstrap.Modal.getInstance(document.getElementById("todoModal")).hide();
    currentPage = 1;
    loadTodos();
  }
});

searchForm.addEventListener("submit", e => {
  e.preventDefault();
  const query = searchInput.value.trim();
  currentPage = 1;
  loadTodos(query);
});

exportBtn.addEventListener("click", () => {
  const todos = JSON.parse(localStorage.getItem("todos")) || [];
  let csv = "Title,Description,Timestamp\n";
  todos.forEach(todo => {
    csv += `"${todo.title}","${todo.text}","${todo.timestamp}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'todos.csv';
  a.click();
  URL.revokeObjectURL(url);
});

loadTodos();

// Dark mode toggle with reload
const themeToggle = document.getElementById("toggle-theme");
const icon = themeToggle.querySelector("i");

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  icon.classList.remove("bi-moon-fill");
  icon.classList.add("bi-brightness-high-fill");
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");

  if (isDark) {
    icon.classList.remove("bi-moon-fill");
    icon.classList.add("bi-brightness-high-fill");
  } else {
    icon.classList.remove("bi-brightness-high-fill");
    icon.classList.add("bi-moon-fill");
  }

  localStorage.setItem("theme", isDark ? "dark" : "light");

  // ✅ Reload cards to apply correct done background color
  loadTodos(searchInput.value.trim());
});
