var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");

  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  //check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// allows existing tasks to be edited on click.
$(".list-group").on("click", "p", function(){
  var text = $(this)
    .text()
    .trim();

  // tells jQuery to create a new textarea element saved in textInput
  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);

  $(this).replaceWith(textInput);
  textInput.trigger("focus");
});

// blur event will trigger anytime a user interacts with anything other than the textarea element
$(".list-group").on("blur", "textarea", function(){
  // get the textarea's current value/text
  var text = $(this)
    .val()
    .trim()

  //get the parent ul's id attribute
  var status = $(this)
  .closest(".list-group")
  .attr("id")
  .replace("list-", "");

  //get the task's position in the list of other li elements
  var index = $(this)
  .closest(".list-group-item")
  .index();

  // tasks = object, tasks[stats] = returns an array, tasks[status][index] = returns object at the given index in an array, tasks[status][index].text = returns the text property of the object at the given index. 
  tasks[status][index].text = text;
  saveTasks();

  //recreate p element
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);
  
  //replace textarea with p element
  $(this).replaceWith(taskP);
});

//due date was clicked
$(".list-group").on("click", "span", function(){
  // get current text
  var date = $(this)
  .text()
  .trim();

  //create new input element
  var dateInput = $("<input>")
  .attr("type", "text")
  .addClass("form-control")
  .val(date);

  //swap out elements
  $(this).replaceWith(dateInput);

  //enable jquery ui datepicker
  dateInput.datepicker({
    minDate:1,
    onClose: function() {
      //when calendar is closed without making changes, force a "change" event on the 'dateInput'
      $(this).trigger("change");
    }
  });

  //automatically focus on new element
  dateInput.trigger("focus");
})

//value of due date was changed
$(".list-group").on("change", "input[type='text']", function() {
  /// get current text
  var date = $(this)
    .val()
    .trim();

  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array and re-save to localstorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);

  //pask tasks <li> element into auditTask to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

//make task items draggable
$(".card .list-group").sortable({ // turns any element with list-group class sortable
  //linked the sortable lists with other lists with same class
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  // clone tells jquery to create a copy to move instead of original - helps with preventing accidental triggers on original element
  helper: "clone",
  //event listeners
  activate: function(event) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  //activate and deactive trigger once for all connected lists as soon as dragging starts and stops
  deactivate: function(event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass(".bottom-trash-drag");
  },
  //over and out triggers when a dragged item enters or leaves a connected list 
  over: function(event) {
    $(this).addClass("dropover-active");
  },
  out: function(event) {
    $(this).addClass("dropover-active");
  },
  // triggers when contents of a list have changed
  update: function(event) {
   // array to store the task data in
    var tempArr = [];

    // loop over current set of children in sortable list
    $(this).children().each(function() {
      var text = $(this)
        .find("p")
        .text()
        .trim();

      var date = $(this)
        .find("span")
        .text()
        .trim();

      // add task data to the temp array as an object
      tempArr.push({
        text: text,
        date: date
      });
    });

    /// trim down list's ID to match object property
    var arrName = $(this)
    .attr("id")
    .replace("list-", "");

    // update array on tasks object and save - when refresh tasks will stay in the column
    tasks[arrName] = tempArr;
    saveTasks();

  }
});

//makes trash div droppable
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    console.log("drop");
    // removes element from the dom completely
    ui.draggable.remove();
    $(".bottom-trash").removeClass(".bottom-trash-activate");
  },
  over: function(event, ui) {
    console.log("over");
    $("bottom.trash").addClass(".bottom-trash-activate");
  },
  out: function(event, ui) {
    console.log("out");
    $(".bottom-trash").removeClass(".bottom-trash-activate");
  },
});

// adds date picker to modal
$("#modalDueDate").datepicker({
  // date limite to be one day from current date
  minDate: 1
});


// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// when element is sent into auditTask, we can get date info and parse it into a moment obj using Moment.js
var auditTask = function(taskEl) {
  // get date from task element
  var date = $(taskEl).find("span").text().trim();

  //convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour",17);

  //remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  //apply new class if task is near/over due date
  if(moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  } else if (Math.abs(moment().diff(time, "days")) <=2) {
    $(taskEl).addClass("list-group-item-warning");
  }

  console.log(taskEl);
};

// runs audittask function every 5 seconds to see if colors need to be updated
setInterval(function() {
  $(".card .list-group-item").each(function(index, el){
    auditTask(el);
  });
}, 1800000);

// load tasks for the first time
loadTasks();


