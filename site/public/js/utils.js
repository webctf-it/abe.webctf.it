document.addEventListener("DOMContentLoaded", ()=>{
    const navBurger = document.querySelector(".navbar-burger")
    navBurger.addEventListener("click", (e)=>{
      const nav = document.getElementById(navBurger.dataset.target)
      navBurger.classList.toggle("is-active")
      nav.classList.toggle("is-active")
    })
  })