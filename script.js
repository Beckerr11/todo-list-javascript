function addTask() {

let input = document.getElementById("taskInput")

let task = input.value

if(task === "") return

let li = document.createElement("li")

li.textContent = task

document.getElementById("taskList").appendChild(li)

input.value = ""

}