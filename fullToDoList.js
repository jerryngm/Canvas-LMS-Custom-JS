if (currentURL.indexOf('/gradebook/speed_grader?') > -1) {createToDoButton ();} //Only run the following script in the Speedgrade page

function createToDoButton () {
	html = '<button type="button" class="Button Button--primary" id="btn_todolist"><i class="icon-solid icon-notepad" aria-hidden="true" /> Full To Do List</button>' //html button
	$('#speed_grader_settings_mount_point').after(html);	//add the button 'after' class speed_grader_settings_mount_point
	document.getElementById('btn_todolist').addEventListener("click", openToDoDialog); //add on Click event listener to the button
}

function openToDoDialog () {
html='<div id="tododialog" title="Full To Do List"><div id="msg_todolist"><p><strong>To Do list is loading. Please wait!  <i class="icon-progress" aria-hidden="true"/> </strong></p></div><button type="button" class="Button Button--secondary" id="btn_refreshToDo"><i class="icon-solid icon-refresh" aria-hidden="true" /> Refresh ungraded list</button><table id="todolist" class="table table-bordered" style="width:100%" cellspacing="0"><thead></thead></table></div>'
$('.ic-app').after(html);
document.querySelector('#btn_refreshToDo').addEventListener("click", refreshToDoList);
document.querySelector('#btn_refreshToDo').style.display = 'none';

//create a dialog using jQuery
(function() {
$('#tododialog').dialog({width: $(window).width(), height:$(window).height(), //Make the dialog full screen
close: function( event, ui ) {closetodo();}})
}());

//Load required libraries to display data
		var css = "https://cdn.datatables.net/v/dt/jszip-2.5.0/dt-1.11.3/b-2.2.1/b-html5-2.2.1/b-print-2.2.1/kt-2.6.4/sp-1.4.0/sl-1.3.4/datatables.min.css";
		$('head').append( $('<link rel="stylesheet" type="text/css" />').attr('href', css) );
		
		var js = "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js";
		$.getScript( js, function( data, textStatus, jqxhr ) {
				//console.log( "MomentJS loaded" );	
			});
		var js = "https://cdn.datatables.net/v/dt/jszip-2.5.0/dt-1.11.3/b-2.2.1/b-html5-2.2.1/b-print-2.2.1/kt-2.6.4/sp-1.4.0/sl-1.3.4/datatables.min.js";
		$.getScript( js, function( data, textStatus, jqxhr ) {
				 //console.log( "DataTables loaded" );
				 GetTodoList();		
			
});

}

//Get the To Do list via GraphQL
function GetTodoList() {
    var query
    var tdlist_filtered

    query =
        `{
  allCourses {
    name
    _id
    submissionsConnection(filter: {states: submitted}) {
      nodes {
        gradingStatus
        submissionStatus
        submittedAt
        state
        assignment {
          _id
          name
        }
        user {
          _id
          name
          sisId
          email
          enrollments {
            state
            course {
              _id
            }
          }
        }
      }
    }
  }
}`;

    $.ajax({
        url: '/api/graphql',
        type: 'POST',
        data: {
            query: 'query ' + query
        },
        beforeSend: function(xhr) {
            
        },

        success: function(result, status, xhr) {
            tdlist_filtered = result.data.allCourses.filter(d => d.submissionsConnection.nodes.length !== 0); //Remove blank results
            CreateTodoListArray(tdlist_filtered)
            //console.log(tdlist_filtered)

        },
        error: function() {},
    });

}

//Add results to an Array
function CreateTodoListArray(data) {

    //console.log(data)
    var requests = 0;
    var todolist = [];
    var classlist = 0;
    var submissionlist = 0;
    var enrolmentlist = 0;
	var canvas_url = window.location.origin;
    for (classlist = 0; classlist < data.length; classlist++) {
        //console.log('length of classlist', data.length)
        //console.log('current class', classlist)
        submissionlist = 0;
        for (submissionlist = 0; submissionlist < data[classlist].submissionsConnection.nodes.length; submissionlist++) {
            console.log('length of node', data[classlist].submissionsConnection.nodes.length)
            console.log('current submission', submissionlist)
            for (enrolmentlist = 0; enrolmentlist < data[classlist].submissionsConnection.nodes[submissionlist].user.enrollments.length; enrolmentlist++) {
                if (data[classlist].submissionsConnection.nodes[submissionlist].user.enrollments[enrolmentlist].course._id == data[classlist]._id && data[classlist].submissionsConnection.nodes[submissionlist].user.enrollments[enrolmentlist].state == 'active') {
                    todolist.push({
                        coursename: data[classlist].name,
                        stdname: data[classlist].submissionsConnection.nodes[submissionlist].user.name,
                        stdvtid: data[classlist].submissionsConnection.nodes[submissionlist].user.sisId,
                        stdemail: data[classlist].submissionsConnection.nodes[submissionlist].user.email,
                        assname: data[classlist].submissionsConnection.nodes[submissionlist].assignment.name,
                        submittedat: data[classlist].submissionsConnection.nodes[submissionlist].submittedAt,
                        daysince: moment().diff(data[classlist].submissionsConnection.nodes[submissionlist].submittedAt, 'days'),
                        speedgrader: canvas_url + '/courses/' + data[classlist]._id + '/gradebook/speed_grader?assignment_id=' + data[classlist].submissionsConnection.nodes[submissionlist].assignment._id + '&student_id=' + data[classlist].submissionsConnection.nodes[submissionlist].user._id
                    })
                }
            }


        }


    }
    CreateTodoListTable(todolist);
}

//Using DataTable library to create table and display the data
function CreateTodoListTable(data) {
    //console.log(data);
    var table;
   document.getElementById("msg_todolist").style.display = 'none';
   document.querySelector('#btn_refreshToDo').style.display = 'block';
 
    setHeader();

    function setHeader() {
        var $tr = $('<tr>');
        $tr.append($('<th>').text("Course Name"));
        $tr.append($('<th>').text("Student Name"));
        $tr.append($('<th>').text("Student ID"));
        $tr.append($('<th>').text("Student Email"));
        $tr.append($('<th>').text("Assignment Name"));
        $tr.append($('<th>').text("Submitted At"));
        $tr.append($('<th>').text("Day Since Submitted"));
        $tr.append($('<th>').text("SpeedGrader Link"));
        $tr.appendTo('#todolist thead');
    }

    table = $('#todolist').DataTable({

        data: data,
        "lengthMenu": [20, 50, 100],
        "ordering": true,
        "order": [
            [6, "desc"]
        ],
        "processing": true,
        destroy: true,
        "columns": [{
                data: "coursename",
            },
            {
                data: "stdname"
            },
            {
                data: "stdvtid",
                visible: false
            },
            {
                data: "stdemail"
            },
            {
                data: "assname"
            },
            {
                data: "submittedat"
            },
            {
                data: "daysince"
            },
            {
                data: "speedgrader"
            }
        ],
        keys: true,
        dom: 'iPlfrtip',
        searchPanes: {
            cascadePanes: true,
            columns: [0]
        },
        "columnDefs": [{
                targets: [5],
                data: "submittedat",
                render: function(data, type, row, meta) {
                    moment.updateLocale(moment.locale(), {
                        invalidDate: ""
                    });
                    return moment(data).format('DD/MM/YYYY HH:MM');
                }
            },
            {
                targets: 7,
                render: function(data, type, row, meta) {
                    return '<a href="' + data + '"target=”_blank”>' + data + '</a>';
                }
            }
        ],
        buttons: [{
                extend: 'excelHtml5',
                filename: 'Canvas_Ungraded_Report_' + moment().format('DDMMYYYY'),
                title: '',
                autoFilter: true
            },
            {
                extend: 'copyHtml5',
            },
            {
                extend: 'print'
            }

        ]


    });
    table.buttons().container().insertAfter('#todolist_length');
};

function closetodo () {
        $('#todolist').DataTable().clear().destroy();
        $('#todolist').find('tr').remove();
		$('#msg_todolist').remove();
		$('#btn_refreshToDo').remove();
		$('#todolist').remove();
		console.log("ToDo Dialog Closed");
}

function refreshToDoList () {
console.log("ToDo List Refreshed");
    if ($.fn.DataTable.isDataTable('#todolist')) {
        $('#todolist').DataTable().clear().destroy();
        $('#todolist').find('tr').remove();
        GetTodoList();
   document.getElementById("msg_todolist").style.display = 'block';
   document.querySelector('#btn_refreshToDo').style.display = 'none';
    }

}