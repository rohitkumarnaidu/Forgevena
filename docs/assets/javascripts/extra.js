document$.subscribe(() => {
  document.querySelectorAll("table").forEach((table) => {
    if (!table.parentElement?.classList.contains("table-scroll")) {
      const wrapper = document.createElement("div");
      wrapper.className = "table-scroll";
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });
});
