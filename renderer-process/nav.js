const links = document.querySelectorAll('link[rel="import"]')
let sectionId = false

// Import and add each page to the DOM
Array.prototype.forEach.call(links, (link) => {
    let template = link.import.querySelector('.task-template')
    let clone = document.importNode(template.content, true)
    document.querySelector('.content').appendChild(clone)
})

Array.prototype.forEach.call(document.querySelectorAll(".section-selector"),(ss)=>{
    ss.addEventListener('click',(event)=>{
        handleSectionTrigger(event)
    })
})

function handleSectionTrigger (event) {
    hideAllSections()

    // Display the current section
    sectionId = `${event.target.dataset.section}-section`
    document.getElementById(sectionId).classList.add('is-shown')
}

function activateDefaultSection () {
    document.getElementById("dashboard-section").classList.add('is-shown')
}

function hideAllSections() {
    const sections = document.querySelectorAll('section.is-shown')
    Array.prototype.forEach.call(sections, (section) => {
        section.classList.remove('is-shown')
    })
}

if (!sectionId){
    activateDefaultSection()
}
