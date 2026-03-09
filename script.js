function addTask(){

let input = document.getElementById("taskInput")
let task = input.value

if(task === "") return

let li = document.createElement("li")

li.textContent = task

// marcar concluído
li.onclick = function(){
li.classList.toggle("done")
}

// botão deletar
let deleteBtn = document.createElement("button")
deleteBtn.textContent = "❌"

deleteBtn.onclick = function(){
li.remove()
}

li.appendChild(deleteBtn)

document.getElementById("taskList").appendChild(li)

input.value=""

}