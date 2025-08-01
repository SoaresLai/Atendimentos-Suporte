// Auto-refresh metrics every 30 seconds
setInterval(() => {
  fetch("/Home/GetMetrics")
    .then((response) => response.json())
    .then((data) => {
      // Update metric cards
      updateMetricCard("total-atendimentos", data.totalAtendimentos)
      updateMetricCard("resolvidos", data.resolvidos)
      updateMetricCard("nao-resolvidos", data.naoResolvidos)
      updateMetricCard("taxa-conclusao", data.taxaConclusao + "%")

      // Update progress bar
      const progressBar = document.querySelector(".progress-bar")
      if (progressBar) {
        progressBar.style.width = data.taxaConclusao + "%"
      }
    })
    .catch((error) => console.error("Error updating metrics:", error))
}, 30000)

function updateMetricCard(id, value) {
  const element = document.getElementById(id)
  if (element) {
    element.textContent = value
  }
}

// Form validation enhancement
document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form")
  forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      const requiredFields = form.querySelectorAll("[required]")
      let isValid = true

      requiredFields.forEach((field) => {
        if (!field.value.trim()) {
          field.classList.add("is-invalid")
          isValid = false
        } else {
          field.classList.remove("is-invalid")
        }
      })

      if (!isValid) {
        e.preventDefault()
        showAlert("Por favor, preencha todos os campos obrigatórios.", "danger")
      }
    })
  })
})

function showAlert(message, type) {
  const alertDiv = document.createElement("div")
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`
  alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `

  const container = document.querySelector(".container-fluid")
  container.insertBefore(alertDiv, container.firstChild)

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    alertDiv.remove()
  }, 5000)
}

// Smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  })
})
